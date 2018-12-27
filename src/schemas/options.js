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
    plugins: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
          moduleDidLoad: {
            instanceof: 'Function',
            errorMessage: 'should be function'
          },
          moduleDidParse: {
            instanceof: 'Function',
            errorMessage: 'should be function'
          },
          moduleWillBundle: {
            instanceof: 'Function',
            errorMessage: 'should be function'
          }
        }
      },
      default: []
    },
    map: {
      instanceof: 'Function'
    },
    onpath: {
      instanceof: 'Function'
    },
    onbundle: {
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
    }
  },
  additionalProperties: false
};
