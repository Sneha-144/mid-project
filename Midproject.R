library(tidyverse)
library(ggplot2)
whr = read.csv("World Happiness Report.csv")
head(whr, 10)

#check for missing values
table(is.na(whr))
# FALSE - 27877 TRUE - 710

#COPY ORIGINAL DATASET
whr_clean = whr

whr_cleaned = whr_clean %>%
  {
    message("Missing values count BEFORE cleaning:")
    print(sum(is.na(.)))
    
    message("\nFinal row count before cleaning:")
    print(nrow(.))
    .
  } %>%
  
  drop_na() %>%
  
  distinct() %>%
  {
    message("\nMissing values count AFTER cleaning:")
    print(sum(is.na(.)))
    
    message("Final row count after cleaning:")
    print(nrow(.))
    .
  }

head(whr_cleaned)

#arrange data by Happiness score
df_whr = whr_cleaned %>%
  arrange(desc(Life.Ladder)) %>%
  slice_head(n=20) %>%
  mutate(Country_Name = forcats::fct_reorder(Country.Name, Life.Ladder))


# Create the simple bar chart
original_plot <- ggplot(df_whr, aes(x = Country_Name, y = Life.Ladder)) +
  geom_col(fill = "skyblue3") +
  #coord_flip() + # Flip coordinates for better readability of country names
  labs(
    title = "Original Plot: Top 20 Happiest Countries (Simple Ranking)",
    y = "Life Ladder (0-10)",
    x = NULL
  ) +
  theme_minimal()
original_plot
