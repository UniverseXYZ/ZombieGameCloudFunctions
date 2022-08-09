import request from 'graphql-request';
import { GetUserEligibleRespose, SetUserScoreArgs, TheGraphResponse } from './user';
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
}
