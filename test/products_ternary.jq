# Product data transformation with ternary operator for conditional logic
.products | map({
  name: .name,
  price: .price,
  inventory_value: (.price * .quantity),
  availability: (.inStock | if . then "In Stock (" + ($parent.quantity | tostring) + " units)" else "Out of Stock" end),
  popularity: {
    rating: .rating,
    review_count: .reviews,
    sentiment: (
      if .rating >= 4.5 then "Excellent"
      elif .rating >= 4.0 then "Very Good"
      elif .rating >= 3.0 then "Good"
      else "Average"
      end
    )
  },
  tags: .tags
})