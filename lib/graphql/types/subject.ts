import { nonNull, objectType, extendType, intArg } from 'nexus';

import type { Context } from '../context';
import type { chii_episodes } from '../../generated/client';

const Episode = objectType({
  name: 'Episode',
  definition(t) {
    t.nonNull.int('id');
    t.nonNull.string('name');
    t.nonNull.string('name_cn');
    t.nonNull.string('description');
    t.nonNull.int('type');
    t.nonNull.string('duration');
    t.nonNull.float('sort');
  },
});

const Subject = objectType({
  name: 'Subject',
  definition(t) {
    t.nonNull.int('id');
    t.nonNull.string('name');
    t.nonNull.string('name_cn');
    t.list.nonNull.field('episodes', {
      type: Episode,
      args: {
        limit: nonNull(intArg({ default: 30 })),
        offset: nonNull(
          intArg({
            default: 0,
            description:
              '超出范围时会返回空数据。可以使用负数，来获取最后几个章节。如 `-1` 会返回最后一个章节， `-2` 会返回最后两个章节',
          }),
        ),
        type: intArg(),
      },
      async resolve(
        parent: { id: number },
        { limit, offset, type }: { limit: number; offset: number; type: number | undefined },
        { prisma }: Context,
      ) {
        if (offset < 0) {
          const count = await prisma.chii_episodes.count({
            where: { ep_type: type ?? undefined, ep_subject_id: parent.id },
          });
          offset = count + offset;
        }

        const episodes = await prisma.chii_episodes.findMany({
          orderBy: { ep_sort: 'asc' },
          where: { ep_type: type ?? undefined, ep_subject_id: parent.id },
          skip: offset,
          take: limit,
        });

        return episodes.map((e: chii_episodes) => {
          return {
            id: e.ep_id,
            name: e.ep_name,
            name_cn: e.ep_name_cn,
            description: e.ep_desc,
            type: e.ep_type,
            duration: e.ep_duration,
            sort: e.ep_sort,
          };
        });
      },
    });
  },
});

const SubjectByIDQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('subject', {
      type: Subject,
      args: { id: nonNull(intArg()) },
      async resolve(_parent, { id }: { id: number }, ctx: Context) {
        const subject = await ctx.prisma.chii_subjects.findUnique({
          where: {
            subject_id: id,
          },
        });

        if (!subject) {
          return null;
        }

        if (subject.subject_nsfw && !ctx.auth.allowNsfw) {
          return null;
        }

        return {
          id: subject.subject_id,
          name: subject.subject_name,
          name_cn: subject.subject_name_cn,
        };
      },
    });
  },
});

export default [Episode, Subject, SubjectByIDQuery];