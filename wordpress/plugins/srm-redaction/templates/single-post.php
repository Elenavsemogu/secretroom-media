<?php
/**
 * Safe single template: related cards without get_the_excerpt() (it re-enters the_content and can fatal).
 * SEO format: no dek (Description is meta-only), no cover/emoji block, no draft screenshots in body.
 */
get_header();

while (have_posts()) :
    the_post();
    $post_id = get_the_ID();
    $format  = function_exists('srm_format') ? srm_format($post_id) : 'main';
    $accent  = function_exists('srm_accent') ? srm_accent($post_id) : 'yellow';
    $emoji   = function_exists('srm_meta') ? srm_meta('_srm_emoji', $post_id, '📰') : '📰';
    $cats    = get_the_category($post_id);
    $cat     = $cats ? $cats[0]->name : '';
    $partner = function_exists('srm_meta') ? srm_meta('_srm_partner_link', $post_id) : '';
    $articles_url = get_permalink(get_option('page_for_posts')) ?: home_url('/articles/');
    $is_seo = ($format === 'seo');
    ?>
<main class="wrap">
  <article>
    <nav class="breadcrumbs" aria-label="Хлебные крошки">
      <a href="<?php echo esc_url(home_url('/')); ?>">Главная</a>
      <span>/</span>
      <a href="<?php echo esc_url($articles_url); ?>">Статьи</a>
      <span>/</span>
      <span><?php the_title(); ?></span>
    </nav>

    <header class="article-hero">
      <?php if ($format === 'promo') : ?>
        <span class="badge promo">Реклама</span>
      <?php elseif ($format === 'tg') : ?>
        <span class="badge tg">из Telegram</span>
      <?php elseif ($is_seo) : ?>
        <span class="badge cat"><?php echo esc_html($cat ?: 'Гайд'); ?></span>
      <?php else : ?>
        <span class="badge cat"><?php echo esc_html($cat); ?></span>
      <?php endif; ?>
      <h1 class="display" style="font-size:clamp(32px,5vw,56px);margin:14px 0 12px;text-transform:uppercase"><?php the_title(); ?></h1>
      <?php if (!$is_seo) : ?>
      <p class="dek" style="font-size:18px;max-width:60ch;margin-bottom:14px"><?php
        $dek = get_post_field('post_excerpt', $post_id);
        if (!is_string($dek) || trim($dek) === '') {
            $dek = (string) get_post_field('post_content', $post_id);
        }
        echo esc_html(wp_trim_words(wp_strip_all_tags($dek), 40, '…'));
      ?></p>
      <?php endif; ?>
      <div class="meta" style="color:var(--gray);font-weight:700;font-size:14px">
        <?php echo esc_html(get_the_author()); ?> ·
        <?php echo esc_html(function_exists('srm_fmt_date') ? srm_fmt_date(get_the_date('c')) : get_the_date()); ?> ·
        <?php echo (int) (function_exists('srm_reading_time') ? srm_reading_time($post_id) : 1); ?> мин
      </div>
    </header>

    <?php if (!$is_seo) : ?>
    <?php if (has_post_thumbnail()) : ?>
      <div class="article-cover" style="margin:18px 0 28px;border:3px solid var(--ink);border-radius:var(--radius);overflow:hidden">
        <?php the_post_thumbnail('large', ['style' => 'display:block;width:100%;height:auto']); ?>
      </div>
    <?php else : ?>
      <div class="article-cover" style="margin:18px 0 28px;height:220px;border:3px solid var(--ink);border-radius:var(--radius);background:var(--<?php echo esc_attr($accent); ?>);display:grid;place-items:center;font-size:72px">
        <?php echo esc_html($emoji); ?>
      </div>
    <?php endif; ?>
    <?php endif; ?>

    <div class="article-body<?php echo $is_seo ? ' seo-article' : ''; ?>">
      <?php the_content(); ?>
      <?php if ($partner) : ?>
        <div class="inline-promo" style="background:var(--<?php echo esc_attr($accent); ?>)">
          <span class="promo-tag">Партнёрская ссылка</span>
          <h4>Перейти к партнёру</h4>
          <p style="margin-top:10px"><a class="btn" href="<?php echo esc_url($partner); ?>" target="_blank" rel="noopener">Открыть ↗</a></p>
        </div>
      <?php endif; ?>
      <div class="share-bar" id="share-bar">
        <span class="share-label">Поделиться материалом</span>
        <button type="button" class="share-btn" data-share="telegram">Telegram</button>
        <button type="button" class="share-btn" data-share="vk">ВКонтакте</button>
        <button type="button" class="share-btn" data-share="copy">Копировать ссылку</button>
      </div>
    </div>
  </article>

  <section class="section">
    <div class="section-head"><h2>Читайте ещё</h2><a href="<?php echo esc_url($articles_url); ?>">Все статьи →</a></div>
    <div class="cards">
      <?php
      $seo_ids = function_exists('srm_seo_post_ids') ? srm_seo_post_ids() : [];
      $more = get_posts([
          'post_type'      => 'post',
          'post_status'    => 'publish',
          'posts_per_page' => 3,
          'post__not_in'   => array_merge([$post_id], $seo_ids),
          'orderby'        => 'date',
          'order'          => 'DESC',
          'no_found_rows'  => true,
      ]);
      foreach ($more as $item) {
          echo srm_redaction_safe_card((int) $item->ID);
      }
      ?>
    </div>
  </section>
</main>
    <?php
endwhile;

get_footer();
