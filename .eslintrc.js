module.exports = {
    root: true,
    parserOptions: {
        parser: 'babel-eslint',
    },
    env: {
        browser: true,
    },
    extends: [
        // https://github.com/standard/standard/blob/master/docs/RULES-en.md
        'standard',
    ],
    plugins: [],
    rules: {
        indent: ['error', 2],
        "no-useless-escape":["off"]
    },
};
