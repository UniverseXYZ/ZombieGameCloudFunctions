/* eslint-disable import/no-named-as-default */
import to from 'await-to-js';
import * as functions from 'firebase-functions';
import { UserService } from './user.service';
const userService = new UserService();

export const getUserEligible = functions.https.onRequest(async (request, response): Promise<any> => {
  const [err, userEligibleResponse] = await to(userService.getUserEligible(<string>request.query.id));

  if (err) {
    return response.status(500);
  }

  return response.json(userEligibleResponse);
});

export const getUserHasPolyMorphs = functions.https.onRequest(async (request, response): Promise<any> => {
  const [err, hasPoly] = await to(userService.getUserHasPolyMorphs(<string>request.query.walletAddress));

  if (err) {
    return response.status(500);
  }

  return response.json({
    hasPoly,
  });
});

export const getPolyMorphsMetadata = functions.https.onRequest(async (request, response): Promise<any> => {
  const [err, metadata] = await to(userService.getUserPolyMorphs(<string>request.query.walletAddress));

  if (err) {
    return response.status(500);
  }

  return response.json({
    metadata,
  });
});
