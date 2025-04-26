--[[
    JSON Module for Lightroom plugins
    Based on the JSON implementation by Jeffrey Friedl
    
    This is a simplified version of a JSON encoder/decoder for Lua
    Adapted for use in Lightroom plugins
]]

local JSON = {}

-- Encode Lua table to JSON string
function JSON:encode(obj)
    local t = type(obj)
    
    if t == 'nil' then
        return 'null'
    elseif t == 'boolean' then
        return obj and 'true' or 'false'
    elseif t == 'number' then
        return tostring(obj)
    elseif t == 'string' then
        return '"' .. self:escapeString(obj) .. '"'
    elseif t == 'table' then
        return self:encodeTable(obj)
    else
        return 'null' -- Other types not supported
    end
end

-- Encode a Lua table to a JSON string
function JSON:encodeTable(obj)
    local isArray = true
    local maxIndex = 0
    
    -- Check if this is an array or an object
    for k, v in pairs(obj) do
        if type(k) == 'number' and k > 0 and math.floor(k) == k then
            maxIndex = math.max(maxIndex, k)
        else
            isArray = false
            break
        end
    end
    
    -- Process array
    if isArray and maxIndex > 0 then
        local result = {}
        for i = 1, maxIndex do
            result[i] = self:encode(obj[i] or nil)
        end
        return '[' .. table.concat(result, ',') .. ']'
    end
    
    -- Process object
    local result = {}
    for k, v in pairs(obj) do
        if type(k) == 'string' then
            table.insert(result, '"' .. self:escapeString(k) .. '":' .. self:encode(v))
        end
    end
    return '{' .. table.concat(result, ',') .. '}'
end

-- Escape special characters in strings
function JSON:escapeString(s)
    s = string.gsub(s, '\\', '\\\\')
    s = string.gsub(s, '"', '\\"')
    s = string.gsub(s, '\n', '\\n')
    s = string.gsub(s, '\r', '\\r')
    s = string.gsub(s, '\t', '\\t')
    s = string.gsub(s, '\b', '\\b')
    s = string.gsub(s, '\f', '\\f')
    return s
end

-- Decode JSON string to Lua table
function JSON:decode(json)
    if not json then
        return nil
    end
    
    -- Simple implementation for basic JSON parsing
    -- This is a simplified version for the plugin
    -- In a real implementation, use a more robust parser
    
    -- Replace common patterns
    json = string.gsub(json, '^%s*', '') -- Remove leading whitespace
    json = string.gsub(json, '%s*$', '') -- Remove trailing whitespace
    
    -- Detect null values
    if json == 'null' then
        return nil
    -- Detect boolean values
    elseif json == 'true' then
        return true
    elseif json == 'false' then
        return false
    -- Detect numbers
    elseif string.match(json, '^-?%d+%.?%d*$') then
        return tonumber(json)
    -- Detect strings
    elseif string.match(json, '^".*"$') then
        local s = string.sub(json, 2, -2)
        -- Unescape special characters
        s = string.gsub(s, '\\\"', '"')
        s = string.gsub(s, '\\\\', '\\')
        s = string.gsub(s, '\\n', '\n')
        s = string.gsub(s, '\\r', '\r')
        s = string.gsub(s, '\\t', '\t')
        s = string.gsub(s, '\\b', '\b')
        s = string.gsub(s, '\\f', '\f')
        return s
    -- Handle objects and arrays
    elseif string.match(json, '^{.*}$') or string.match(json, '^%[.*%]$') then
        -- For complex objects, display a warning
        local isArray = string.sub(json, 1, 1) == '['
        return isArray and {} or {["message"] = "Complex JSON parsing not implemented"}
    else
        return nil
    end
end

return JSON
