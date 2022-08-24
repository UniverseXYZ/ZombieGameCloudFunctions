import axios from 'axios';
import request from 'graphql-request';
import { GetUserEligibleRespose, MetaDataResponse, SetUserScoreArgs, TheGraphResponse } from './user';
import { UserModel } from './user.model';
import { GET_POLYMORPHS_QUERY } from './user.queries';
const flatten = require('flat');

export class UserService {
  async getUserEligible(id: string): Promise<GetUserEligibleRespose> {
    const user = await this.getUser(id);
    const walletAddress = <string>user?.walletAddress;
    const hasPoly = await this.getUserHasPolyMorphs(walletAddress);

    if (!user || !hasPoly || user?.idIsUsed) {
      return {
        isEligible: false,
      };
    }

    return UserModel.findOneAndUpdate({
      'id': id,
    }, {
      'idIsUsed': true,
    })
      .exec()
      .then(() => {
        return {
          isEligible: true,
          walletAddress,
        };
      });
  }

  async getUserId(walletAddress: string) {
    const hasPoly = await this.getUserHasPolyMorphs(walletAddress);
    if (hasPoly) {
      return UserModel.findOneAndUpdate({
        'walletAddress': walletAddress,
      }, {
        walletAddress,
        id: Math.random().toString(36).substring(2, 12).toUpperCase(),
        idIsUsed: false,
      }, {
        upsert: true,
        new: true,
      })
        .exec()
        .then((user) => user);
    }

    return null;
  }

  async getIdUsed(walletAddress: string) {
    const user = await this.getUserFromWalletAddress(walletAddress);
    return {
      isIdUsed: user?.idIsUsed ? user?.idIsUsed : false,
      id: user?.id ? user.id : '',
    };
  }

  private getUser(id: string) {
    return UserModel.findOne({
      'id': id,
    })
      .exec()
      .then((user) => user);
  }

  async getUserHasPolyMorphs(walletAddress: string) {
    const theGraphV1Response = <TheGraphResponse>(await request(<string>process.env.THE_GRAPH_V1_URL, GET_POLYMORPHS_QUERY, {
      walletAddress,
    }));

    const theGraphV2Response = <TheGraphResponse>(await request(<string>process.env.THE_GRAPH_V2_URL, GET_POLYMORPHS_QUERY, {
      walletAddress,
    }));

    return theGraphV1Response.transferEntities.length > 0 || theGraphV2Response.transferEntities.length > 0;
  }


  async setUserScore(args: SetUserScoreArgs) {
    const user = await this.getUserFromWalletAddress(args.walletAddress);
    const updateQuery = {
      ...args,
    };

    if (user!.score >= updateQuery.score!) {
      return Promise.resolve();
    }

    return UserModel.findOneAndUpdate({
      'walletAddress': args.walletAddress,
    }, {
      ...flatten(updateQuery),
    })
      .exec()
      .then((updatedUser) => updatedUser);
  }

  private getUserFromWalletAddress(walletAddress: string) {
    return UserModel.findOne({
      'walletAddress': walletAddress,
    })
      .exec()
      .then((user) => user);
  }

  async getUserPolyMorphs(walletAddress: string) {
    const theGraphV1Response = <TheGraphResponse>(await request(<string>process.env.THE_GRAPH_V1_URL, GET_POLYMORPHS_QUERY, {
      walletAddress,
    }));
    const theGraphV2Response = <TheGraphResponse>(await request(<string>process.env.THE_GRAPH_V2_URL, GET_POLYMORPHS_QUERY, {
      walletAddress,
    }));
    const v1Ids = theGraphV1Response.transferEntities.map((entity) => entity.tokenId);
    const v2Ids = theGraphV2Response.transferEntities.map((entity) => entity.tokenId);
    let metadataV1 = [];
    let metadataV2 = [];

    if (v1Ids.length > 0) {
      metadataV1 = await this.getMetadataFromTokenIds(v1Ids.join(), <string>process.env.THE_GRAPH_V1_GET_METADATA);
    }

    if (v2Ids.length > 0) {
      metadataV2 = await this.getMetadataFromTokenIds(v2Ids.join(), <string>process.env.THE_GRAPH_V2_GET_METADATA);
    }

    return metadataV1.concat(metadataV2);
  }

  private getMetadataFromTokenIds(tokenIds: string, url: string) {
    return axios({
      method: 'GET',
      url,
      params: {
        ids: tokenIds,
      },
    })
      .then((res) => {
        const polysMetadata = res.data;

        return polysMetadata.map((metadata: MetaDataResponse) => {
          return {
            name: metadata.name,
            type: metadata.character,
            imageUrl: metadata.imageurl,
          };
        });
      });
  }
}


