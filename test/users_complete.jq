# Advanced user data transformation
# Get active developers with their skills, sorted by skill count
[
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
] | sort_by(-.skill_count)