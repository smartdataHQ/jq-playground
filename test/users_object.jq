# User data transformation with object construction
.users[] 
| select(.active == true and .role == "developer") 
| {
    name: .name, 
    email: .email, 
    skill_count: (.skills | length),
    skills: .skills,
    github: (.profile.social.github // "N/A"),
    experience: ("Joined " + .joinDate + " in " + .city)
  }