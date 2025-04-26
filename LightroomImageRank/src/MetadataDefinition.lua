--[[
Metadata definition for Image Quality Rank plugin
Defines custom metadata fields for storing image quality scores
]]

return {
	metadataFieldsForPhotos = {
		{
			id = 'AIQualityScore',
			title = 'AI Quality Score',
			dataType = 'string', -- Using string to display decimal values
			searchable = true,
			version = 1,
		},
		{
			id = 'AIQualityRanking',
			title = 'Quality Ranking',
			dataType = 'string',
			searchable = true,
			version = 1,
		},
	},
	schemaVersion = 1,
}
