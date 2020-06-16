/*
 * Copyright © 2019 Bonitasoft S.A.
 * Bonitasoft, 32 rue Gustave Eiffel - 38000 Grenoble
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import { BdrLogger } from '../src/logger/BdrLogger';
import { BdrServer } from '../src/server/BdrServer';
import { Configuration } from '../src/server/Configuration';
import { Application } from 'express';

const request = require('supertest');
const fs = require('fs');

BdrLogger.init(new Configuration());

describe('BdrServer_e2e', () => {
  const simpleBdmXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <businessObjectModel modelVersion="1.0"' +
    ' productVersion="7.10.0-SNAPSHOT"> <businessObjects> <businessObject qualifiedName="com.company.model.BusinessObject"> ' +
    '<fields> <field type="STRING" length="255" name="attribute1" nullable="true" collection="false"/> </fields>' +
    ' <uniqueConstraints/> <queries/> <indexes/> </businessObject> </businessObjects> </businessObjectModel>';

  const simpleBdmJson =
    '{"businessObjects":[{"qualifiedName":"com.company.model.BusinessObject","name":"BusinessObject","description":"",' +
    '"attributes":[{"name":"attribute1","type":"STRING","nullable":true,"collection":false,"description":""}],"attributeQueries":[{"name":"findByAttribute1",' +
    '"filters":[{"name":"attribute1","type":"STRING","collection":false}]},{"name":"find","filters":[]},{"name":"findByPersistenceId",' +
    '"filters":[{"name":"persistenceId","type":"INTEGER","collection":false}]}],"constraintQueries":[],"customQueries":[]}]}';

  let app: Application;
  beforeAll(() => {
    let server = new BdrServer(new Configuration());
    server.addGraphqlRoute();
    server.addBdmPostRoute();
    server.addBdmDeleteRoute();
    server.addBdmJsonRoute();
    app = server.getExpressApp();
  });

  test('POST simple bdm content', async () => {
    const res = await request(app)
      .post('/bdm')
      .set('Content-Type', 'application/json')
      .send({ bdmXml: simpleBdmXml });

    expect(res.statusCode).toEqual(200);
  });

  test('POST invalid bdm content', async () => {
    const res = await request(app)
      .post('/bdm')
      .set('Content-Type', 'application/json')
      .send({ bdmXml: 'invalid BDM' });

    expect(res.statusCode).toEqual(500);
  });

  test('Send graphQL introspection request', async done => {
    // Post BDM
    const res = await request(app)
      .post('/bdm')
      .set('Content-Type', 'application/json')
      .send({ bdmXml: simpleBdmXml });
    expect(res.statusCode).toEqual(200);

    // Check graphQL introspection
    request(app)
      .post(BdrServer.getBdmGraphqlPath())
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ query: ' { __type(name: "com_company_model_BusinessObject") { name }}' })
      .expect(
        200,
        {
          data: { __type: { name: 'com_company_model_BusinessObject' } }
        },
        done
      );
  });

  test('Send bdm request', async () => {
    // Post BDM
    const res = await request(app)
      .post('/bdm')
      .set('Content-Type', 'application/json')
      .send({ bdmXml: simpleBdmXml });
    expect(res.statusCode).toEqual(200);

    // Check json bdm
    const res2 = await request(app)
      .get(BdrServer.getBdmJsonPath())
      .set('Accept', 'application/json');
    expect(res2.statusCode).toEqual(200);
    expect(res2.text).toEqual(simpleBdmJson);
  });

  test('POST all bdms content', async () => {
    let xmlFiles = fs.readdirSync('test/resources');
    for (const xmlFile of xmlFiles) {
      let bdmXmlContent = fs.readFileSync('test/resources/' + xmlFile, 'utf8');
      const res = await request(app)
        .post('/bdm')
        .set('Content-Type', 'application/json')
        .send({ bdmXml: bdmXmlContent });

      expect(res.statusCode).toEqual(200);
    }
  });

  test('DELETE bdm', async done => {
    // Post BDM
    const resPost = await request(app)
      .post('/bdm')
      .set('Content-Type', 'application/json')
      .send({ bdmXml: simpleBdmXml });
    expect(resPost.statusCode).toEqual(200);

    const resDelete = await request(app).delete('/bdm');
    expect(resDelete.statusCode).toEqual(200);

    // Check graphQL introspection : should have no type
    request(app)
      .post(BdrServer.getBdmGraphqlPath())
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ query: ' { __type(name: "com_company_model_BusinessObject") { name }}' })
      .expect(
        200,
        {
          data: { __type: null }
        },
        done
      );
  });
});
