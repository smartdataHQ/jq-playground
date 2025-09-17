# Product data transformation with map and object construction
.products | map({
  name: .name,
  price: .price,
  inventory_value: (.price * .quantity),
  tags: .tags
})