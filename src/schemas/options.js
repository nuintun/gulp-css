const cwd = process.cwd();

export default {
  title: 'gulp-css',
  description: 'A gulp plugin for cmd transport and concat.',
  type: 'object',
  properties: {
    root: {
      type: 'string',
      default: cwd
    },
    map: {
      instanceof: 'Function'
    },
    combine: {
      oneOf: [
        {
          type: 'boolean'
        },
        {
          instanceof: 'Function'
        }
      ],
      default: false,
      errorMessage: 'should be boolean or function'
    },
    onpath: {
      instanceof: 'Function'
    },
    onbundle: {
      instanceof: 'Function'
    },
    plugins: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
          moduleDidLoaded: {
            instanceof: 'Function',
            errorMessage: 'should be function'
          },
          moduleDidParsed: {
            instanceof: 'Function',
            errorMessage: 'should be function'
          },
          moduleDidCompleted: {
            instanceof: 'Function',
            errorMessage: 'should be function'
          }
        }
      },
      default: []
    }
  },
  additionalProperties: false
};
