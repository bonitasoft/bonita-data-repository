module.exports = {
  roots: ['./test'],
  reporters: ['default',['jest-junit', {outputDirectory: 'target/reports', outputName: 'report.xml'}],],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
