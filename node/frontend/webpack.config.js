module.exports = {
    reactScriptsVersion: "react-scripts" /* (default value) */,
    webpack: {
        mode: 'extends',
        configure: {
            module: {
                rules: [
                    // {
                    //     test: /\.js$/,
                    //     enforce: "pre",
                    //     use: ["source-map-loader"],
                    // },
                ],
            },
        },
    },
}