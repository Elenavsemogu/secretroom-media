<?php
/**
 * Blog index / articles archive
 */
get_header();
?>
<main class="wrap">
  <section class="section">
    <div class="section-head">
      <h2>Статьи <span class="dot">/</span> все материалы</h2>
    </div>

    <?php
    $cats = get_categories(['hide_empty' => true]);
    if ($cats) :
    ?>
      <div class="svc-cats" style="margin-bottom:22px">
        <a class="svc-cat-pill<?php echo !is_category() ? ' active' : ''; ?>" href="<?php echo esc_url(get_permalink(get_option('page_for_posts')) ?: home_url('/articles/')); ?>">Все</a>
        <?php foreach ($cats as $c) : ?>
          <a class="svc-cat-pill<?php echo is_category($c->term_id) ? ' active' : ''; ?>" href="<?php echo esc_url(get_category_link($c)); ?>">
            <?php echo esc_html($c->name); ?> <span class="svc-count"><?php echo (int) $c->count; ?></span>
          </a>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <div class="cards">
      <?php if (have_posts()) :
        $i = 0;
        while (have_posts()) : the_post();
          echo srm_card_html(get_the_ID(), $i === 0);
          $i++;
        endwhile;
      else : ?>
        <p style="font-weight:700;color:var(--gray)">Пока нет статей.</p>
      <?php endif; ?>
    </div>

    <div style="margin-top:28px">
      <?php the_posts_pagination(['mid_size' => 2, 'prev_text' => '←', 'next_text' => '→']); ?>
    </div>
  </section>
</main>
<?php get_footer(); ?>
