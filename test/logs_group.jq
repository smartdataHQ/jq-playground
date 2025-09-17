# Log data transformation with group_by and map
.logs 
| group_by(.level) 
| map({
    level: .[0].level,
    count: length,
    entries: map({
      time: .timestamp,
      message: .message,
      endpoint: .endpoint
    })
  })