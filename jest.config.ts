import type {Config} from "jest";

const config: Config = {
    testEnvironment: "jsdom",
    testPathIgnorePatterns: ['/node_modules/', '/.clone/'],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", {tsconfig: {jsx: "react-jsx"}}],
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    },
};

export default config;
