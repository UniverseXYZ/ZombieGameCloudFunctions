import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, connection } from 'mongoose';
import { UserService } from '../api/user/user.service';
import { UserServiceSpecHelper } from './user.service.spec.helper';
require('dotenv').config();

describe('UserServiceSpec', () => {
  let userService: UserService;
  let mongoMemoryServer: MongoMemoryServer;
  let userServiceSpecHelper: UserServiceSpecHelper;
  const userMetrics = {
    score: 10,
    enemyKillCount: 1,
    timeInSeconds: 10,
  };

  beforeAll(async () => {
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = await mongoMemoryServer.getUri();
    userService = new UserService();
    userServiceSpecHelper = new UserServiceSpecHelper();
    await connect(uri);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
    await mongoMemoryServer.stop();
  });

  test('getUserHasPolyMorphs', async () => {
    // const userHasV1PolyMorphs = await userService.getUserHasPolyMorphs(<string>process.env.V1_WALLET_ADDRESS);
    const userHasV2PolyMorphs = await userService.getUserHasPolyMorphs(<string>process.env.V2_WALLET_ADDRESS);
    const userHasPolyMorphs = await userService.getUserHasPolyMorphs('');

    // expect(userHasV1PolyMorphs).toBe(true);
    expect(userHasV2PolyMorphs).toBe(true);
    expect(userHasPolyMorphs).toBe(false);
  });

  test('getUserEligible', async () => {
    const user = await userServiceSpecHelper.updateUser(<string>process.env.V2_WALLET_ADDRESS);
    let userEligibleResponse = await userService.getUserEligible(user.id);

    expect(userEligibleResponse.isEligible).toBe(true);
    expect(userEligibleResponse.walletAddress).toBe(user.walletAddress);

    userEligibleResponse = await userService.getUserEligible(user.id);
    expect(userEligibleResponse.isEligible).toBe(false);
  });

  test('setUserScore', async () => {
    const user = await userService.setUserScore({
      walletAddress: <string>process.env.V2_WALLET_ADDRESS,
      ...userMetrics,
    });

    expect(user?.score).toBe(userMetrics.score);
    expect(user?.enemyKillCount).toBe(userMetrics.enemyKillCount);
    expect(user?.timeInSeconds).toBe(userMetrics.timeInSeconds);
  });

  test('getUserPolyMorphsMetadata', async () => {
    const metadata = await userService.getUserPolyMorphs(<string>process.env.V2_WALLET_ADDRESS);
    expect(metadata).not.toBe([]);

    const emptyMetadata = await userService.getUserPolyMorphs('');
    expect(emptyMetadata).toStrictEqual([]);
  });
});
