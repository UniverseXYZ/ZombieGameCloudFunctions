import request from 'graphql-request';
import { UserModel } from './user.model';
import { GET_POLYMORPHS_QUERY } from './user.queries';

export class UserService {
  async getUserEligible(id: string) {
    const user = await this.getUser(id);
    const hasPoly = await this.checkForPolyMorph(<string>user?.walletAddress);

    if (!user) {
      return false;
    }

    if (!hasPoly) {
      return false;
    }

    if (user?.idIsUsed) {
      return false;
    }

    return UserModel.findOneAndUpdate({
      'id': id,
    }, {
      'idIsUsed': true,
    })
      .exec()
      .then(() => true);
  }

  private getUser(id: string) {
    return UserModel.findOne({
      'id': id,
    })
      .exec()
      .then((user) => user);
  }

  private checkForPolyMorph(walletAddress: string) {
    return request(<string>process.env.THE_GRAPH_URL, GET_POLYMORPHS_QUERY, {
      walletAddress,
    })
      .then((res) => res);
  }
}
