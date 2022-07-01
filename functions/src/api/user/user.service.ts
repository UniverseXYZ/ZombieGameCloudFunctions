import request from 'graphql-request';
import { GetUserEligibleRespose } from './user';
import { UserModel } from './user.model';
import { GET_POLYMORPHS_QUERY } from './user.queries';

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

  getUserHasPolyMorphs(walletAddress: string) {
    return request(<string>process.env.THE_GRAPH_URL, GET_POLYMORPHS_QUERY, {
      walletAddress,
    })
      .then((res) => res.transferEntities.length > 0);
  }
}
