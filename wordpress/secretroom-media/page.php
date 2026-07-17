<?php
/**
 * Default page
 */
get_header();
?>
<main class="wrap">
  <?php while (have_posts()) : the_post(); ?>
    <section class="section">
      <div class="section-head"><h2><?php the_title(); ?></h2></div>
      <div class="article-body"><?php the_content(); ?></div>
    </section>
  <?php endwhile; ?>
</main>
<?php get_footer(); ?>
