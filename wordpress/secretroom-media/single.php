<?php
get_header();

while (have_posts()) : the_post();
  $format = srm_format();
  $accent = srm_accent();
  $emoji  = srm_meta('_srm_emoji', null, '📰');
  $cats   = get_the_category();
  $cat    = $cats ? $cats[0]->name : '';
  $partner = srm_meta('_srm_partner_link');
?>
<main class="wrap">
  <article>
    <nav class="breadcrumbs" aria-label="Хлебные крошки">
      <a href="<?php echo esc_url(home_url('/')); ?>">Главная</a>
      <span>/</span>
      <a href="<?php echo esc_url(get_permalink(get_option('page_for_posts')) ?: home_url('/articles/')); ?>">Статьи</a>
      <span>/</span>
      <span><?php the_title(); ?></span>
    </nav>

    <header class="article-hero">
      <?php if ($format === 'promo') : ?>
        <span class="badge promo">Реклама</span>
      <?php elseif ($format === 'tg') : ?>
        <span class="badge tg">из Telegram</span>
      <?php else : ?>
        <span class="badge cat"><?php echo esc_html($cat); ?></span>
      <?php endif; ?>
      <h1 class="display" style="font-size:clamp(32px,5vw,56px);margin:14px 0 12px;text-transform:uppercase"><?php the_title(); ?></h1>
      <p class="dek" style="font-size:18px;max-width:60ch;margin-bottom:14px"><?php echo esc_html(get_the_excerpt()); ?></p>
      <div class="meta" style="color:var(--gray);font-weight:700;font-size:14px">
        <?php echo esc_html(get_the_author()); ?> ·
        <?php echo esc_html(srm_fmt_date(get_the_date('c'))); ?> ·
        <?php echo (int) srm_reading_time(); ?> мин
      </div>
    </header>

    <?php if (has_post_thumbnail()) : ?>
      <div class="article-cover" style="margin:18px 0 28px;border:3px solid var(--ink);border-radius:var(--radius);overflow:hidden">
        <?php the_post_thumbnail('large', ['style' => 'display:block;width:100%;height:auto']); ?>
      </div>
    <?php else : ?>
      <div class="article-cover" style="margin:18px 0 28px;height:220px;border:3px solid var(--ink);border-radius:var(--radius);background:var(--<?php echo esc_attr($accent); ?>);display:grid;place-items:center;font-size:72px">
        <?php echo esc_html($emoji); ?>
      </div>
    <?php endif; ?>

    <div class="article-body">
      <?php the_content(); ?>
      <?php if ($partner) : ?>
        <div class="inline-promo" style="background:var(--<?php echo esc_attr($accent); ?>)">
          <span class="promo-tag">Партнёрская ссылка</span>
          <h4>Перейти к партнёру</h4>
          <p style="margin-top:10px"><a class="btn" href="<?php echo esc_url($partner); ?>" target="_blank" rel="noopener">Открыть ↗</a></p>
        </div>
      <?php endif; ?>
    </div>
  </article>

  <section class="section">
    <div class="section-head"><h2>Читайте ещё</h2><a href="<?php echo esc_url(get_permalink(get_option('page_for_posts')) ?: home_url('/articles/')); ?>">Все статьи →</a></div>
    <div class="cards">
      <?php
      $more = new WP_Query([
          'post_type'      => 'post',
          'posts_per_page' => 3,
          'post__not_in'   => [get_the_ID()],
      ]);
      while ($more->have_posts()) : $more->the_post();
          echo srm_card_html(get_the_ID());
      endwhile;
      wp_reset_postdata();
      ?>
    </div>
  </section>
</main>
<?php
endwhile;
get_footer();
