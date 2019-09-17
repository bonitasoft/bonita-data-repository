
class GraphqlSchemaGenerator {

    constructor(bdmJson) {
        this.bdmJson = bdmJson;
        this.schema = [];
        this.resolvers = [];
    }

    generate() {
        let bdm = JSON.parse(this.bdmJson);

        // Generate types
        let bdmBusObjects = this._asArray(bdm.businessObjectModel.businessObjects.businessObject);
        let myself = this;
        bdmBusObjects.forEach(function (bdmBusObject) {
            let bdmObjectName = myself._getLastItem(bdmBusObject._attributes.qualifiedName);
            myself.schema.push('type ', bdmObjectName, ' {\n');
            let bdmAtts = bdmBusObject.fields.field;
            if (bdmAtts) {
                myself.schema.push(myself._generateAttributes(myself._asArray(bdmAtts)));
            }
            let bdmAttRels = bdmBusObject.fields.relationField;
            if (bdmAttRels) {
                myself.schema.push(myself._generateRelationAttributes(myself._asArray(bdmAttRels)));
            }
            myself.schema.push('}\n\n');
        });

        //
        // Query generation
        //

        // Start Query
        this.schema.push('type Query {\n');

        // Generate default queries
        bdmBusObjects.forEach(function (bdmBusObject) {
            let bdmObjectName = myself._getLastItem(bdmBusObject._attributes.qualifiedName);
            let bdmAtts = bdmBusObject.fields.field;
            if (bdmAtts) {
                myself.schema.push(myself._generateAttributeQueries(bdmObjectName, myself._asArray(bdmAtts)));
                myself.schema.push('\t', bdmObjectName, '_findBy: ', bdmObjectName, '\n');
            }
        });

        // Generate default queries from unique constraints
        // bdmBusObjects.forEach(function (bdmBusObject) {
        //     let constraints = bdmBusObject.uniqueConstraints.uniqueConstraint.fieldNames.fieldName;
        //     if (constraints) {
        //
        //     }
        // });

        // Generate custom queries

        // End Query
        this.schema.push('}\n\n');


        // Generate enums (?)
        // Add documentation for graphQL (?)

        console.debug('schema=\n' + this.schema.join(''));
    }

    getResolvers() {
        this.resolvers = this._generateInfoResolver();
        return this.resolvers;
    }

    getSchema() {
        return this.schema.join('');
    }

    _generateAttributes(bdmAttsArray) {
        let myself = this;
        bdmAttsArray.forEach((bdmAtt) => {
            let mandatoryStr = bdmAtt._attributes.nullable === 'true' ? '' : '!';
            let xmlType = myself._xmlToGraphqlType(bdmAtt._attributes.type);
            myself.schema.push('\t', bdmAtt._attributes.name, ': ', xmlType + mandatoryStr, '\n');
        });

    }

    _generateRelationAttributes(bdmRelAttsArray) {
        let myself = this;
        bdmRelAttsArray.forEach((bdmRelAtt) => {
            let relType = this._getLastItem(bdmRelAtt._attributes.reference);
            let mandatoryStr = bdmRelAtt._attributes.nullable === 'true' ? '' : '!';
            myself.schema.push('\t', bdmRelAtt._attributes.name, ': ', relType + mandatoryStr, '\n');

        });
    }

    _generateAttributeQueries(bdmObjectName, bdmAttsArray) {
        let myself = this;
        bdmAttsArray.forEach((bdmAtt) => {
            let attName = bdmAtt._attributes.name;
            let xmlType = myself._xmlToGraphqlType(bdmAtt._attributes.type);
            myself.schema.push('\t', bdmObjectName,
                '_findBy', myself._capitalizeFirstLetter(attName), '(', attName, ': ', xmlType, '!): ', bdmObjectName, '\n');
        });

    }

    _generateInfoResolver() {
        return { Query: { info: () => `This is the API of BDM repository`}};
    }

    _xmlToGraphqlType(xmlType) {
        switch (xmlType) {
            case "BOOLEAN":
                return "Boolean";
            case "INTEGER":
            case "LONG":
                return "Int";
            case "DOUBLE":
            case "FLOAT":
                return "Float";
            case "STRING":
            case "LOCALDATE":
            case "LOCALDATETIME":
            case "OFFSETDATETIME":
            case "DATE":
            case "TEXT":
                return "String";
            default:
                return xmlType;
        }
    }

    _asArray(element) {
        // Put element in an array (if needed)
        let arr;
        if (!Array.isArray(element)) {
            arr = [];
            arr.push(element)
        } else {
            arr = element;
        }
        return arr;
    }

    _getLastItem(path) {
        return path.substring(path.lastIndexOf('.') + 1);
    }

    _capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

module.exports = GraphqlSchemaGenerator;