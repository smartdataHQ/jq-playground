# Log data transformation with conditional logic
.logs 
| group_by(.level) 
| map({
    level: .[0].level,
    count: length,
    entries: map({
      time: .timestamp,
      message: .message,
      endpoint: .endpoint,
      details: (
        if .level == "error" then 
          {error_code: (.error.code // .error.field), error_message: .error.message} 
        elif .level == "warn" then 
          {warning_details: (.memoryUsage // {})} 
        else 
          {user: (.userId // "system"), response_time: (.responseTime // 0)}
        end
      )
    })
  })