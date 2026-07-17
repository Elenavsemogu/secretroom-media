<?php
get_header();
?>
<main class="wrap">
  <section class="section">
    <div class="section-head"><h2><?php the_archive_title(); ?></h2></div>
    <div class="cards">
      <?php if (have_posts()) : while (have_posts()) : the_post();
        echo srm_card_html(get_the_ID());
      endwhile; else : ?>
        <p style="font-weight:700;color:var(--gray)">Пусто.</p>
      <?php endif; ?>
    </div>
  </section>
</main>
<?php get_footer(); ?>
