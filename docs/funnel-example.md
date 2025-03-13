# New Year Sales - Marketing Funnel Examples

This document provides three example marketing funnels for the New Year Sales campaign, following the database schema structure.

## Funnel 1

```
{
  name: "Holiday Discount E-commerce Funnel",
  description: "A traditional linear e-commerce funnel designed to convert holiday shoppers through targeted discounts and urgency.",
  projectId: "proj-newyearsales"
}
```

### Stages:

#### Stage 1

```
{
  name: "Awareness",
  description: "Initial introduction to the sale and brand offers",
  funnelId: "fnl-holiday-discount"
}
```

##### Stage Items:

```
{
  name: "Hero Banner",
  description: "Main promotional banner",
  stageId: "stg-awareness",
  type: "text",
  content: "New Year, New You! Our biggest sale of the year starts now with up to 70% off everything. Limited time only!"
}
```

```
{
  name: "Secondary Banner",
  description: "Supporting promotional message",
  stageId: "stg-awareness",
  type: "text",
  content: "End the year with amazing deals on all your favorite brands. New inventory just added for our New Year celebration!"
}
```

#### Stage 2

```
{
  name: "Interest/Consideration",
  description: "Building interest through curated collections",
  funnelId: "fnl-holiday-discount"
}
```

##### Stage Items:

```
{
  name: "Collection Promotion",
  description: "Showcasing curated product collections",
  stageId: "stg-interest",
  type: "text",
  content: "Shop our curated New Year collections: Fitness Essentials, Home Refresh, and Tech Upgrades - all with special New Year pricing."
}
```

```
{
  name: "Clearance Alert",
  description: "Highlighting clearance items",
  stageId: "stg-interest",
  type: "text",
  content: "Customer favorites from 2023 are now on clearance! See what everyone loved this year before they're gone forever."
}
```

#### Stage 3

```
{
  name: "Evaluation",
  description: "Helping customers compare and evaluate products",
  funnelId: "fnl-holiday-discount"
}
```

##### Stage Items:

```
{
  name: "Comparison Tool Promotion",
  description: "Tool to help customers compare products",
  stageId: "stg-evaluation",
  type: "text",
  content: "Compare your favorites with our interactive product comparison tool. Find the perfect fit for your New Year goals."
}
```

```
{
  name: "Review Showcase",
  description: "Highlighting customer reviews",
  stageId: "stg-evaluation",
  type: "text",
  content: "Read verified customer reviews on our top-selling New Year items. 4.8/5 average rating from 10,000+ happy customers!"
}
```

#### Stage 4

```
{
  name: "Decision",
  description: "Providing incentives to finalize purchase decision",
  funnelId: "fnl-holiday-discount"
}
```

##### Stage Items:

```
{
  name: "Coupon Code",
  description: "Discount code promotion",
  stageId: "stg-decision",
  type: "text",
  content: "Use code NEWYEAR24 for an EXTRA 15% off your order + free shipping on orders over $50!"
}
```

```
{
  name: "Flash Sale",
  description: "Limited-time additional discount",
  stageId: "stg-decision",
  type: "text",
  content: "⏰ Flash Sale Alert: Additional 10% discount automatically applied at checkout for the next 24 hours only!"
}
```

#### Stage 5

```
{
  name: "Purchase",
  description: "Facilitating final purchase step",
  funnelId: "fnl-holiday-discount"
}
```

##### Stage Items:

```
{
  name: "Shipping Guarantee",
  description: "Delivery guarantee message",
  stageId: "stg-purchase",
  type: "text",
  content: "Complete your purchase now to guarantee delivery before New Year's Eve! Express shipping available."
}
```

```
{
  name: "Support Offer",
  description: "Customer support availability",
  stageId: "stg-purchase",
  type: "text",
  content: "Need help? Our holiday shopping assistants are available 24/7 via chat to assist with your purchase."
}
```

## Funnel 2

```
{
  name: "Multi-Channel Social Media Funnel",
  description: "A modern omnichannel approach leveraging social media engagement to drive New Year sales conversions across platforms.",
  projectId: "proj-newyearsales"
}
```

### Stages:

#### Stage 1

```
{
  name: "Social Media Discovery",
  description: "Initial touchpoints on social media platforms",
  funnelId: "fnl-multichannel-social"
}
```

##### Stage Items:

```
{
  name: "Instagram Story Ad",
  description: "Promotional story ad on Instagram",
  stageId: "stg-social-discovery",
  type: "text",
  content: "Instagram Story Ad: Swipe up to discover our exclusive New Year collection! Limited quantities available. #NewYearNewDeals"
}
```

```
{
  name: "Facebook Carousel Ad",
  description: "Multi-image carousel ad on Facebook",
  stageId: "stg-social-discovery",
  type: "text",
  content: "Facebook Carousel Ad: New Year. New Beginnings. New Savings. Scroll through our top 5 New Year deals with up to 65% off!"
}
```

#### Stage 2

```
{
  name: "Website Landing",
  description: "First website experience after clicking through from social media",
  funnelId: "fnl-multichannel-social"
}
```

##### Stage Items:

```
{
  name: "Welcome Banner",
  description: "Personalized welcome message based on traffic source",
  stageId: "stg-website-landing",
  type: "text",
  content: "Welcome from Instagram! Your exclusive 10% New Year discount has been automatically applied to your session."
}
```

```
{
  name: "Countdown Promotion",
  description: "Daily deal countdown timer",
  stageId: "stg-website-landing",
  type: "text",
  content: "Join our New Year countdown! New deals unlocked every day until January 1st. Today's special: Buy One Get One 50% Off!"
}
```

#### Stage 3

```
{
  name: "Engagement",
  description: "Interactive elements to increase user engagement",
  funnelId: "fnl-multichannel-social"
}
```

##### Stage Items:

```
{
  name: "Personalization Quiz",
  description: "Interactive quiz for personalized recommendations",
  stageId: "stg-engagement",
  type: "text",
  content: "Take our 'New Year, New You' quiz to get personalized product recommendations perfect for your 2024 resolutions."
}
```

```
{
  name: "Social Share Promotion",
  description: "Incentive for social media sharing",
  stageId: "stg-engagement",
  type: "text",
  content: "Share your wishlist on social media with #MyNewYearPicks to be entered into our $1,000 shopping spree giveaway!"
}
```

#### Stage 4

```
{
  name: "Consideration",
  description: "Building product consideration through expert content",
  funnelId: "fnl-multichannel-social"
}
```

##### Stage Items:

```
{
  name: "Live Shopping Event",
  description: "Promotion for live product demonstration",
  stageId: "stg-consideration",
  type: "text",
  content: "Join our live shopping event tonight at 8PM EST! Our experts will demonstrate the top 10 products for 2024 with exclusive viewer discounts."
}
```

```
{
  name: "UGC Gallery",
  description: "User-generated content showcase",
  stageId: "stg-consideration",
  type: "text",
  content: "See how our customers are using their New Year purchases with our user-generated content gallery. Real people, real results!"
}
```

#### Stage 5

```
{
  name: "Conversion",
  description: "Final push for purchase completion",
  funnelId: "fnl-multichannel-social"
}
```

##### Stage Items:

```
{
  name: "Cart Timer",
  description: "Urgency message for cart completion",
  stageId: "stg-conversion",
  type: "text",
  content: "Your cart has been reserved for 15 minutes! Complete your purchase now to lock in your New Year savings before time runs out."
}
```

```
{
  name: "Bonus Gift Offer",
  description: "Free gift with purchase incentive",
  stageId: "stg-conversion",
  type: "text",
  content: "Congratulations! You've unlocked our New Year Bonus Gift (valued at $29.99) with your purchase. Add to cart with one click!"
}
```

## Funnel 3

```
{
  name: "Loyalty and Retention Funnel",
  description: "A funnel focused on existing customers, emphasizing loyalty rewards and personalized offers for the New Year.",
  projectId: "proj-newyearsales"
}
```

### Stages:

#### Stage 1

```
{
  name: "Targeted Email Campaign",
  description: "Personalized email outreach to existing customers",
  funnelId: "fnl-loyalty-retention"
}
```

##### Stage Items:

```
{
  name: "VIP Early Access",
  description: "Exclusive early access email",
  stageId: "stg-email-campaign",
  type: "text",
  content: "VIP Early Access: As a valued customer, you're getting 24-hour early access to our New Year Sale before the general public!"
}
```

```
{
  name: "Favorites Restock",
  description: "Personalized restock promotion",
  stageId: "stg-email-campaign",
  type: "text",
  content: "We've saved your favorites from last year! Here's 25% off to restock on your most-loved items for 2024."
}
```

#### Stage 2

```
{
  name: "Personalized Recommendations",
  description: "Custom product recommendations based on purchase history",
  funnelId: "fnl-loyalty-retention"
}
```

##### Stage Items:

```
{
  name: "AI Recommendations",
  description: "Algorithm-based product suggestions",
  stageId: "stg-personalized-recs",
  type: "text",
  content: "Based on your purchase history, we think you'll love these New Year specials handpicked just for you."
}
```

```
{
  name: "Collection Completion",
  description: "Suggestions to complete existing product collections",
  stageId: "stg-personalized-recs",
  type: "text",
  content: "Complete your collection! Items that complement your previous purchases are now on sale for New Year's."
}
```

#### Stage 3

```
{
  name: "Loyalty Status Reminder",
  description: "Highlighting loyalty program benefits and current status",
  funnelId: "fnl-loyalty-retention"
}
```

##### Stage Items:

```
{
  name: "Status Upgrade Incentive",
  description: "Promotion to reach next loyalty tier",
  stageId: "stg-loyalty-status",
  type: "text",
  content: "You're just $75 away from reaching Gold Status for 2024! Gold members receive double points, free shipping all year, and exclusive monthly offers."
}
```

```
{
  name: "Points Balance",
  description: "Information about available loyalty points",
  stageId: "stg-loyalty-status",
  type: "text",
  content: "Your loyalty points balance: 3,450 points. Use them now for up to $50 off your New Year purchase or continue saving for bigger rewards!"
}
```

#### Stage 4

```
{
  name: "Bundle Offers",
  description: "Product bundling incentives",
  funnelId: "fnl-loyalty-retention"
}
```

##### Stage Items:

```
{
  name: "Complete The Set",
  description: "Bundle promotion for complementary items",
  stageId: "stg-bundle-offers",
  type: "text",
  content: "Complete the set! Add the matching items to your cart and save an additional 20% on the bundle during our New Year event."
}
```

```
{
  name: "Upgrade Promotion",
  description: "Trade-in offer for product upgrades",
  stageId: "stg-bundle-offers",
  type: "text",
  content: "Upgrade & Save: Trade in your previous model for the 2024 version and receive a 30% loyalty discount + free premium accessories!"
}
```

#### Stage 5

```
{
  name: "Repurchase & Referral",
  description: "Incentives for repeat purchases and customer referrals",
  funnelId: "fnl-loyalty-retention"
}
```

##### Stage Items:

```
{
  name: "Auto-Delivery Signup",
  description: "Promotion for subscription service",
  stageId: "stg-repurchase-referral",
  type: "text",
  content: "Set up auto-delivery for 2024 and save 15% on every future order. Adjust or cancel anytime."
}
```

```
{
  name: "Referral Program",
  description: "Friend referral incentive",
  stageId: "stg-repurchase-referral",
  type: "text",
  content: "Share the joy! Give 20% off to a friend for New Year's, and you'll get 20% off your next purchase when they shop. Win-win!"
}
```
