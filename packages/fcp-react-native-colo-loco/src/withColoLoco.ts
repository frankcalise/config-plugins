import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";
import { ConfigPlugin, withDangerousMod } from "expo/config-plugins";

const fs = require("fs");
const path = require("path");

async function readFileAsync(path: string) {
  return fs.promises.readFile(path, "utf8");
}

async function saveFileAsync(path: string, content: string) {
  return fs.promises.writeFile(path, content, "utf8");
}

const withIosPodfile: ConfigPlugin<ColoLocoPluginConfig> = (config, props) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, "Podfile");
      const contents = await readFileAsync(file);
      await saveFileAsync(
        file,
        addColoLocoScripts(
          contents,
          config.name,
          props.sourcePath,
          props.excludeTargets
        )
      );
      return config;
    },
  ]);
};

function addColoLocoScripts(
  src: string,
  appName: string,
  sourcePath: string,
  excludeTargets?: string[]
): string {
  const appendExcludeTargets = excludeTargets
    ? `, exclude_targets: ${excludeTargets.join(",")}`
    : "";
  return mergeContents({
    tag: `react-native-colo-loco-scripts`,
    src,
    newSrc: `require_relative '../node_modules/react-native-colo-loco/scripts/ios.rb\nlink_colocated_native_files(app_name: '${appName}', app_path: "${sourcePath}"${appendExcludeTargets})`,
    anchor: /require 'json'/,
    offset: -1,
    comment: "#",
  }).contents;
}

type ColoLocoPluginConfig = {
  excludeTargets?: string[];
  sourcePath: string;
};

const withColoLoco: ConfigPlugin<ColoLocoPluginConfig> = (config, props) => {
  if (!props.sourcePath) {
    throw new Error("No sourcePath defined in props");
  }
  // config = withAndroidSettingsGradle(config, props)
  // config = withAndroidMainApplication(config, props)
  config = withIosPodfile(config, props);
  return config;
};

export default withColoLoco;
