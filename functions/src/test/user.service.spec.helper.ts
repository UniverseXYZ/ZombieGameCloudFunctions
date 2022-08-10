import { UserModel } from '../api/user/user.model';

export class UserServiceSpecHelper {
  updateUser(walletAddress: string) {
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
}
