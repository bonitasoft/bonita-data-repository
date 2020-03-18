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
    '{"_businessObjects":[{"qualifiedName":"com.company.model.BusinessObject","name":"BusinessObject","description":"",' +
    '"attributes":[{"name":"attribute1","type":"STRING","nullable":"true"}],"attributeQueries":[{"name":"findByAttribute1",' +
    '"filters":[{"name":"attribute1","type":"STRING"}]},{"name":"find","filters":[]},{"name":"findByPersistenceId",' +
    '"filters":[{"name":"persistenceId","type":"INTEGER"}]}],"constraintQueries":[],"customQueries":[]}]}';

  let app: Application;
  beforeAll(() => {
    let server = new BdrServer(new Configuration());
    server.addGraphqlRoute();
    server.addBdmPostRoute();
    server.addBdmDeleteRoute();
    server.addBdmGetRoute();
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
      .post('/bdr')
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
      .get('/bdm')
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
      .post('/bdr')
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
