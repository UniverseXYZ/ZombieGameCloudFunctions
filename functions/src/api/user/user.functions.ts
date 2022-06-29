/* eslint-disable import/no-named-as-default */
import to from 'await-to-js';
import * as functions from 'firebase-functions';
import { UserService } from './user.service';
const userService = new UserService();

export const getUserEligible = functions.https.onRequest(async (request, response): Promise<any> => {
  const [err, isEligible] = await to(userService.getUserEligible(<string>request.query.id));

  if (err) {
    return response.status(500);
  }

  return response.json({
    isEligible,
  });
});
