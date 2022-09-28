import axios from 'axios';
import { providers } from 'ethers';
import request from 'graphql-request';
import { GetUserEligibleRespose, MetaDataResponse, SetUserScoreArgs, TheGraphResponse } from './user';
import { UserModel } from './user.model';
import { GET_DEVIANTS_QUERY, GET_POLYMORPHS_QUERY } from './user.queries';
const flatten = require('flat');

export class UserService {
  private provider: providers.InfuraProvider;

  constructor() {
    this.provider = new providers.InfuraProvider('homestead', <string>process.env.INFURAID);
  }
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
      .then((usr) => {
        return {
          isEligible: true,
          walletAddress,
          score: usr?.score,
          enemyKillCount: usr?.enemyKillCount,
          timeInSeconds: usr?.timeInSeconds,
          wave: usr?.wave,
        };
      });
  }

  async getUserId(walletAddress: string) {
    const hasPoly = await this.getUserHasPolyMorphs(walletAddress);
    if (hasPoly) {
      const ens = await this.provider.lookupAddress(walletAddress);
      return UserModel.findOneAndUpdate({
        'walletAddress': walletAddress,
      }, {
        walletAddress,
        id: Math.random().toString(36).substring(2, 12).toUpperCase(),
        idIsUsed: false,
        ens: ens ? ens : '',
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
    // const theGraphV1Response = <TheGraphResponse>(await request(<string>process.env.THE_GRAPH_V1_URL, GET_POLYMORPHS_QUERY, {
    //   walletAddress,
    // }));

    const theGraphV2Response = <TheGraphResponse>(await request(<string>process.env.THE_GRAPH_V2_URL, GET_POLYMORPHS_QUERY, {
      walletAddress,
    }));

    const theGraphDeviantsResponse = <TheGraphResponse>(await request(<string>process.env.THE_GRAPH_DEVIANTS_URL, GET_DEVIANTS_QUERY, {
      walletAddress,
    }));

    return theGraphV2Response.transferEntities.length > 0 || theGraphDeviantsResponse.transferEntities.length > 0;
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
    }, {
      new: true,
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
    // const theGraphV1Response = <TheGraphResponse>(await request(<string>process.env.THE_GRAPH_V1_URL, GET_POLYMORPHS_QUERY, {
    //   walletAddress,
    // }));

    const theGraphV2Response = <TheGraphResponse>(await request(<string>process.env.THE_GRAPH_V2_URL, GET_POLYMORPHS_QUERY, {
      walletAddress,
    }));

    const theGraphDeviantsResponse = <TheGraphResponse>(await request(<string>process.env.THE_GRAPH_DEVIANTS_URL, GET_DEVIANTS_QUERY, {
      walletAddress,
    }));

    // const v1Ids = theGraphV1Response.transferEntities.map((entity) => entity.tokenId);
    const v2Ids = theGraphV2Response.transferEntities.map((entity) => entity.tokenId);
    const deviantsIds = theGraphDeviantsResponse.transferEntities.map((entity) => entity.tokenId);
    // let metadataV1 = [];
    let metadataV2 = [];
    const metadataDeviants = [];

    // if (v1Ids.length > 0) {
    //   metadataV1 = await this.getMetadataFromTokenIds(v1Ids.join(), <string>process.env.THE_GRAPH_V1_GET_METADATA);
    // }

    if (v2Ids.length > 0) {
      metadataV2 = await this.getMetadataFromTokenIds(v2Ids.join(), <string>process.env.THE_GRAPH_V2_GET_METADATA);
    }

    const numberOfDeviants = deviantsIds.length > 5 ? 5 : deviantsIds.length;
    for (let i = 0; i < numberOfDeviants; i++) {
      const metadata = await this.getDeviantsMetadataFromTokenId(deviantsIds[i]);
      metadataDeviants.push(metadata);
    }

    return metadataV2.concat(metadataDeviants);
  }

  getLeaderboard() {
    return UserModel
      .find({})
      .sort({ score: -1, _id: 1 })
      .limit(25)
      .select('walletAddress score ens enemyKillCount wave timeInSeconds -_id')
      .then(async (users) => users);
  }

  getPlaceInTheLeaderboard(walletAddress: string) {
    return UserModel.find({})
      .sort({ score: -1, _id: 1 })
      .exec()
      .then((users) => users.findIndex((user) => user.walletAddress === walletAddress) + 1);
  }

  private getDeviantsMetadataFromTokenId(tokenId: string) {
    return axios({
      method: 'GET',
      url: <string>process.env.GET_DEVIANTS_METADATA,
      params: {
        id: tokenId,
      },
    })
      .then((res) => {
        console.log(res.data);
        const metadata = res.data;

        return {
          name: metadata.name,
          type: metadata.attributes.find((attribute: any) => attribute.trait_type == 'Species').value,
          imageUrl: metadata.image,
        };
      });
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
