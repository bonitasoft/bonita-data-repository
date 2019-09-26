const request = require('supertest');
const BdrServer = require('../src/server/BdrServer');

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
});
