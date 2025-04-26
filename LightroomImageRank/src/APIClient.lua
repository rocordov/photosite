--[[
APIClient module for Image Quality Rank plugin
Handles communication with the MCP service for image quality evaluation
]]

local LrHttp = import 'LrHttp'
local LrFileUtils = import 'LrFileUtils'
local LrLogger = import 'LrLogger'
local LrStringUtils = import 'LrStringUtils'
local LrTasks = import 'LrTasks'

local JSON = require 'JSON'

-- Create module logger
local logger = LrLogger('ImageQualityRank-APIClient')
logger:enable('logfile')

local APIClient = {}

-- Default configuration
APIClient.config = {
    baseUrl = "http://localhost:3000", -- Default MCP endpoint
    apiKey = "", -- API key if required by the MCP service
    timeout = 30, -- Timeout in seconds
    retryCount = 3, -- Number of retries for failed requests
    retryDelay = 2, -- Delay between retries in seconds
}

-- Initialize the client with config options
function APIClient.init(config)
    if config then
        for k, v in pairs(config) do
            APIClient.config[k] = v
        end
    end
    
    logger:trace("APIClient initialized with base URL: " .. APIClient.config.baseUrl)
    return APIClient
end

-- Set the API key
function APIClient.setApiKey(apiKey)
    APIClient.config.apiKey = apiKey
    return APIClient
end

-- Encode image file to base64
function APIClient.encodeImageToBase64(filePath)
    local imageData = LrFileUtils.readFile(filePath)
    if not imageData then
        return nil, "Failed to read image file: " .. filePath
    end
    
    -- Base64 encode the image data
    local encoded = LrStringUtils.encodeBase64(imageData)
    return encoded
end

-- Evaluate an image using the MCP service
function APIClient.evaluateImage(imagePath)
    local success, result = pcall(function()
        -- Validate input
        if not imagePath or not LrFileUtils.exists(imagePath) then
            return false, "Image file does not exist: " .. tostring(imagePath)
        end
        
        -- Prepare request
        local url = APIClient.config.baseUrl .. "/evaluate-image"
        
        -- For a more efficient approach, use multipart/form-data instead of base64
        -- But for simplicity in this example, we'll use base64 encoding
        local encoded, encodeError = APIClient.encodeImageToBase64(imagePath)
        if not encoded then
            return false, encodeError
        end
        
        -- Prepare request body
        local requestBody = {
            image = encoded,
            options = {
                model = "image-quality-assessment", -- Specify the model to use
                returnDetailed = true -- Request detailed analysis
            }
        }
        
        -- Convert to JSON
        local jsonBody = JSON:encode(requestBody)
        
        -- Set up headers
        local headers = {
            {"Content-Type", "application/json"},
        }
        
        -- Add API key if available
        if APIClient.config.apiKey and APIClient.config.apiKey ~= "" then
            headers[#headers + 1] = {"X-API-Key", APIClient.config.apiKey}
        end
        
        -- Make HTTP request with retry logic
        local attempt = 0
        local maxAttempts = APIClient.config.retryCount + 1
        local httpResult, httpStatus
        
        repeat
            attempt = attempt + 1
            logger:trace("API request attempt " .. attempt .. "/" .. maxAttempts)
            
            -- Send request
            httpResult, httpStatus = LrHttp.post(url, jsonBody, headers, APIClient.config.timeout)
            
            -- Check for success
            if httpStatus == 200 and httpResult then
                break
            end
            
            -- Log error and retry after delay
            logger:warn("API request failed with status " .. tostring(httpStatus) .. ": " .. tostring(httpResult))
            
            if attempt < maxAttempts then
                logger:trace("Retrying in " .. APIClient.config.retryDelay .. " seconds...")
                LrTasks.sleep(APIClient.config.retryDelay)
            end
        until attempt >= maxAttempts
        
        -- Handle response
        if httpStatus ~= 200 or not httpResult then
            return false, "API request failed after " .. attempt .. " attempts. Status: " .. tostring(httpStatus)
        end
        
        -- Parse JSON response
        local response
        success, response = pcall(function() return JSON:decode(httpResult) end)
        if not success or not response then
            return false, "Failed to parse API response: " .. tostring(response)
        end
        
        -- Validate response format
        if not response.score then
            return false, "Invalid API response format. Missing 'score' field."
        end
        
        -- Return the quality score
        return true, {
            score = response.score,
            details = response.details or {},
        }
    end)
    
    if success then
        return result
    else
        logger:error("Error in evaluateImage: " .. tostring(result))
        return false, "API client error: " .. tostring(result)
    end
end

-- Mock evaluation for testing without an actual MCP service
function APIClient.mockEvaluateImage(imagePath)
    -- Simulate API latency
    LrTasks.sleep(1)
    
    -- Generate a random score
    math.randomseed(os.time())
    local score = math.random(40, 95)
    
    -- Detailed analysis with mock data
    local details = {
        technicalQuality = math.random(30, 100),
        composition = math.random(30, 100),
        exposure = math.random(30, 100),
        sharpness = math.random(30, 100),
        noise = math.random(30, 100),
        colorBalance = math.random(30, 100),
    }
    
    return true, {
        score = score,
        details = details,
    }
end

return APIClient
