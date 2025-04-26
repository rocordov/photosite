--[[

LightroomImageRank.lrplugin

AI-Based Image Quality Evaluation plugin for Adobe Lightroom Classic.
Evaluates images based on quality scores from an external AI model via MCP.

MIT License

]]

return {
	LrSdkVersion = 5.0,
	LrSdkMinimumVersion = 5.0,
	LrToolkitIdentifier = 'com.ai.lightroom.imagerank',
	LrPluginName = 'Image Quality Rank',
	LrLibraryMenuItems = {
		{
			title = 'Evaluate Image Quality',
			file = 'src/EvaluateImages.lua',
			enabledWhen = 'photosAvailable',
		},
		{
			title = 'Settings',
			file = 'src/EvaluateImages.lua',
			enabledWhen = 'always',
			function_name = 'settingsCommand',
		},
	},
	LrMetadataProvider = 'src/MetadataDefinition.lua',
	VERSION = { major=1, minor=0, revision=0 },
}
