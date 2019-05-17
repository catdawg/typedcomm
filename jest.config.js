module.exports = {
    preset: 'ts-jest',
    setupTestFrameworkScriptFile: "jest-extended",
    moduleFileExtensions: [
        "ts",
        "js",
        "json"
    ],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    testMatch: [
        "<rootDir>/test/**/*.test.(ts)"
    ],
    testEnvironment: "node"
};