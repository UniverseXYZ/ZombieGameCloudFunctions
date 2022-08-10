/* eslint-disable import/no-named-as-default */
import to from 'await-to-js';
import * as functions from 'firebase-functions';
import { SetUserScoreArgs } from './user';
import { UserService } from './user.service';
const userService = new UserService();

export const getUserEligible = functions.https.onRequest(async (request, response): Promise<any> => {
  const [err, userEligibleResponse] = await to(userService.getUserEligible(<string>request.query.id));

  if (err) {
    return response.sendStatus(500);
  }

  return response.json(userEligibleResponse);
});

export const getUserHasPolyMorphs = functions.https.onRequest(async (request, response): Promise<any> => {
  const [err, hasPoly] = await to(userService.getUserHasPolyMorphs(<string>request.query.walletAddress));

  if (err) {
    return response.sendStatus(500);
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


export const setUserScore = functions.https.onRequest(async (request, response): Promise<any> => {
  if (request.header('Zombie_Authorization') === process.env.AUTHORIZATION_CODE && request.header('user-agent')?.includes(<string>process.env.USER_AGENT)) {
    let score;
    let enemyKillCount;
    let wave;
    let timeInSeconds;

    if (String(request.body.score)) { // VaRest limitation patch
      score = Number(request.body.score);
      enemyKillCount = Number(request.body.enemyKillCount);
      wave = Number(request.body.wave);
      timeInSeconds = Number(request.body.timeInSeconds);
    } else {
      score = request.body.score;
      enemyKillCount = request.body.enemyKillCount;
      wave = request.body.wave;
      timeInSeconds = request.body; timeInSeconds;
    }

    const setUserScoreArgs = <SetUserScoreArgs>{
      score,
      enemyKillCount,
      wave,
      timeInSeconds,
      walletAddress: request.header('walletAddress'),
    };

    const [err] = await to(userService.setUserScore(setUserScoreArgs));

    if (err) {
      return response.sendStatus(500);
    }

    return response.json({});
  }

  return response.sendStatus(403);
});
