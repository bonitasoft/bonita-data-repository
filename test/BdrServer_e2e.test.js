const request = require('supertest');
const BdrServer = require('../src/server/BdrServer');
const Logger = require('../src/logger/logger');
const fs = require('fs');

Logger.init({});

describe('BdrServer_e2e', () => {
  const simpleBdmXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <businessObjectModel modelVersion="1.0"' +
    ' productVersion="7.10.0-SNAPSHOT"> <businessObjects> <businessObject qualifiedName="com.company.model.BusinessObject"> ' +
    '<fields> <field type="STRING" length="255" name="attribute1" nullable="true" collection="false"/> </fields>' +
    ' <uniqueConstraints/> <queries/> <indexes/> </businessObject> </businessObjects> </businessObjectModel>';

  let myself = this;
  beforeAll(() => {
    let server = new BdrServer([]);
    server.addGraphqlRoute();
    server.addBdmPostRoute();
    server.addBdmDeleteRoute();
    myself.app = server.getExpressApp();
  });

  test('POST simple bdm content', async () => {
    const res = await request(myself.app)
      .post('/bdm')
      .set('Content-Type', 'application/json')
      .send({ bdmXml: simpleBdmXml });

    expect(res.statusCode).toEqual(200);
  });

  test('POST invalid bdm content', async () => {
    const res = await request(myself.app)
      .post('/bdm')
      .set('Content-Type', 'application/json')
      .send({ bdmXml: 'invalid BDM' });

    expect(res.statusCode).toEqual(500);
  });

  test('Send graphQL introspection request', async done => {
    // Post BDM
    const res = await request(myself.app)
      .post('/bdm')
      .set('Content-Type', 'application/json')
      .send({ bdmXml: simpleBdmXml });
    expect(res.statusCode).toEqual(200);

    // Check graphQL introspection
    request(myself.app)
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

  test('POST all bdms content', async () => {
    let xmlFiles = fs.readdirSync('test/resources');
    for (const xmlFile of xmlFiles) {
      let bdmXmlContent = fs.readFileSync('test/resources/' + xmlFile, 'utf8');
      const res = await request(myself.app)
        .post('/bdm')
        .set('Content-Type', 'application/json')
        .send({ bdmXml: bdmXmlContent });

      expect(res.statusCode).toEqual(200);
    }
  });

  test('DELETE bdm', async done => {
    // Post BDM
    const resPost = await request(myself.app)
      .post('/bdm')
      .set('Content-Type', 'application/json')
      .send({ bdmXml: simpleBdmXml });
    expect(resPost.statusCode).toEqual(200);

    const resDelete = await request(myself.app).delete('/bdm');
    expect(resDelete.statusCode).toEqual(200);

    // Check graphQL introspection : should have no type
    request(myself.app)
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
