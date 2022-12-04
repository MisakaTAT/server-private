import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

import { objectType, extendType } from 'nexus';

import type { Context } from '../context';

const __filename = fileURLToPath(new URL(import.meta.url));

const Avatar = objectType({
  name: 'Avatar',
  definition(t) {
    t.nonNull.string('large');
    t.nonNull.string('medium');
    t.nonNull.string('small');
  },
});

const User = objectType({
  name: 'User',
  sourceType: {
    module: path.resolve(path.dirname(__filename), '../..', 'auth', 'index.ts'),
    export: 'IUser',
  },
  definition(t) {
    t.nonNull.int('ID');
    t.nonNull.string('username');
    t.nonNull.string('nickname');
    t.nonNull.field('avatar', {
      type: Avatar,
      resolve(parent) {
        const img = parent.img || 'icon.jpg';

        return {
          large: 'https://lain.bgm.tv/pic/user/l/' + img,
          medium: 'https://lain.bgm.tv/pic/user/m/' + img,
          small: 'https://lain.bgm.tv/pic/user/s/' + img,
        };
      },
    });
  },
});

const GetCurrentUser = extendType({
  type: 'Query',
  definition(t) {
    t.nullable.field('me', {
      type: User,
      async resolve(_parent, _args, { auth }: Context) {
        return auth.user;
      },
    });
  },
});

export default [User, GetCurrentUser];
