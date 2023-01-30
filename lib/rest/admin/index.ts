import { Type as t } from '@sinclair/typebox';

import * as image from '@app/lib/image';
import { AppDataSource, SubjectImageRepo } from '@app/lib/orm';
import { SubjectImage } from '@app/lib/orm/entity';
import { requireLogin, requirePermission } from '@app/lib/rest/hooks/pre-handler';
import type { App } from '@app/lib/rest/type';

// eslint-disable-next-line @typescript-eslint/require-await
export async function setup(app: App) {
  app.addHook('preHandler', requireLogin('admin'));

  app.get('/', (req, res) => {
    return res.view('admin/index');
  });

  app.get(
    '/subject/:subjectID/covers',
    {
      schema: {
        hide: true,
        params: t.Object({ subjectID: t.Integer({ exclusiveMinimum: 0 }) }),
      },
      preHandler: [requirePermission('admin', (a) => a.permission.subject_cover_erase)],
    },
    async ({ params: { subjectID } }, res) => {
      const images = await SubjectImageRepo.findBy({ subjectID });
      await res.view('admin/covers', {
        images: images.filter((x) => x.target.startsWith('raw/')),
      });
    },
  );

  app.delete(
    '/subject/:subjectID/covers',
    {
      schema: {
        hide: true,
        params: t.Object({
          subjectID: t.Integer({ exclusiveMinimum: 0 }),
        }),
        body: t.Object({ imageID: t.Integer({ exclusiveMinimum: 0 }) }),
      },
      preHandler: [requirePermission('admin', (a) => a.permission.subject_cover_erase)],
    },
    async ({ params: { subjectID }, body: { imageID } }, res) => {
      const i = await SubjectImageRepo.findOneBy({ subjectID });

      if (!i) {
        return res.status(404).send();
      }

      await AppDataSource.transaction(async (t) => {
        const SubjectImageRepo = t.getRepository(SubjectImage);
        await SubjectImageRepo.delete(imageID);
        await image.deleteSubjectImage(i.target);
      });
    },
  );
}
