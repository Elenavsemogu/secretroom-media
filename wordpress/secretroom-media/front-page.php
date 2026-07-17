<?php
/**
 * Front page — hero + feed + promo + CTA
 */
get_header();

$mains = srm_query_by_format('main', ['posts_per_page' => 20]);
$tg    = srm_query_by_format('tg', ['posts_per_page' => 10]);
$promo = srm_query_by_format('promo', ['posts_per_page' => 6]);

$main_posts = $mains->posts;
$lead = null;
foreach ($main_posts as $p) {
    if (get_post_meta($p->ID, '_srm_featured', true) === '1') {
        $lead = $p;
        break;
    }
}
if (!$lead && $main_posts) {
    $lead = $main_posts[0];
}
$side = [];
if ($lead) {
    foreach ($main_posts as $p) {
        if ($p->ID === $lead->ID) {
            continue;
        }
        $side[] = $p;
        if (count($side) >= 2) {
            break;
        }
    }
}
$color_map = ['yellow' => 'y', 'pink' => 'p', 'lime' => 'l', 'blue' => 'b'];
?>

<main class="wrap">
  <section class="hero">
    <div class="hero-grid">
      <?php if ($lead) :
        $accent = srm_accent($lead->ID);
        $emoji  = srm_meta('_srm_emoji', $lead->ID, '📰');
        $cats   = get_the_category($lead->ID);
        $cat    = $cats ? $cats[0]->name : '';
        $format = srm_format($lead->ID);
      ?>
        <a class="hero-lead" href="<?php echo esc_url(get_permalink($lead)); ?>">
          <?php if (has_post_thumbnail($lead)) : ?>
            <?php echo get_the_post_thumbnail($lead, 'large', ['class' => 'cover']); ?>
          <?php else : ?>
            <div class="cover" style="background:var(--<?php echo esc_attr($accent); ?>)"></div>
            <div class="cover-emoji"><?php echo esc_html($emoji); ?></div>
          <?php endif; ?>
          <div class="body">
            <span class="badge <?php echo $format === 'tg' ? 'tg' : 'cat'; ?>">
              <?php echo $format === 'tg' ? 'из Telegram' : esc_html($cat); ?>
            </span>
            <h1><?php echo esc_html(get_the_title($lead)); ?></h1>
            <p class="dek"><?php echo esc_html(get_the_excerpt($lead)); ?></p>
          </div>
        </a>
        <div class="hero-side">
          <?php foreach ($side as $p) :
            $pcats = get_the_category($p->ID);
            $pcat  = $pcats ? $pcats[0]->name : '';
          ?>
            <a class="mini" href="<?php echo esc_url(get_permalink($p)); ?>">
              <span class="badge cat"><?php echo esc_html($pcat); ?></span>
              <h3><?php echo esc_html(get_the_title($p)); ?></h3>
              <div class="meta"><?php echo esc_html(srm_fmt_date(get_the_date('c', $p))); ?> · <?php echo (int) srm_reading_time($p->ID); ?> мин</div>
            </a>
          <?php endforeach; ?>
        </div>
      <?php else : ?>
        <div class="hero-lead">
          <div class="cover" style="background:var(--yellow)"></div>
          <div class="body">
            <h1>Secret Room Media</h1>
            <p class="dek">Пока нет статей. Импортируйте демо: Инструменты → Secret Room: демо-контент.</p>
          </div>
        </div>
      <?php endif; ?>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <h2>Свежак <span class="dot">/</span> основное</h2>
      <a href="<?php echo esc_url(get_permalink(get_option('page_for_posts')) ?: home_url('/articles/')); ?>">Все статьи →</a>
    </div>
    <div class="main-layout">
      <div>
        <div class="cards">
          <?php
          $i = 0;
          foreach ($main_posts as $p) {
              if ($lead && $p->ID === $lead->ID) {
                  continue;
              }
              echo srm_card_html($p->ID, $i === 0);
              $i++;
          }
          if ($i === 0) {
              echo '<p style="font-weight:700;color:var(--gray)">Основных статей пока нет.</p>';
          }
          ?>
        </div>
      </div>
      <aside>
        <div class="rail">
          <div class="rail-head">
            <svg class="tg-ico" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M9.8 15.6 9.6 19c.4 0 .6-.2.8-.4l1.9-1.8 3.9 2.9c.7.4 1.2.2 1.4-.7l2.6-12.2c.3-1.1-.4-1.6-1.1-1.3L3.2 9.9c-1.1.4-1.1 1-.2 1.3l3.9 1.2 9-5.7c.4-.3.8-.1.5.2l-6.6 8.7Z"/></svg>
            <h3>Ещё из Telegram</h3>
          </div>
          <div class="rail-note">Короткие посты из канала. Можно почитать здесь или открыть в ТГ.</div>
          <?php if ($tg->have_posts()) : while ($tg->have_posts()) : $tg->the_post();
            $cats = get_the_category();
            $cat  = $cats ? $cats[0]->name : '';
          ?>
            <a class="rail-item" href="<?php the_permalink(); ?>">
              <div class="k"><?php echo esc_html($cat); ?> · из ТГ</div>
              <h4><?php the_title(); ?></h4>
              <div class="meta"><?php echo esc_html(srm_fmt_date(get_the_date('c'))); ?> · почитать здесь или в канале ↗</div>
            </a>
          <?php endwhile; wp_reset_postdata(); else : ?>
            <div class="rail-item">Пока пусто</div>
          <?php endif; ?>
        </div>
      </aside>
    </div>
  </section>

  <section class="section">
    <div class="section-head"><h2>Партнёры <span class="dot">/</span> реклама</h2></div>
    <?php
    $promo_posts = $promo->posts;
    $promo_hero  = $promo_posts[0] ?? null;
    $promo_rest  = array_slice($promo_posts, 1);
    if ($promo_hero) :
      $pa = srm_accent($promo_hero->ID);
      $pe = srm_meta('_srm_emoji', $promo_hero->ID, '📣');
    ?>
      <a class="promo-banner <?php echo esc_attr($color_map[$pa] ?? 'y'); ?>" href="<?php echo esc_url(get_permalink($promo_hero)); ?>">
        <span class="promo-tag">Реклама</span>
        <?php if (has_post_thumbnail($promo_hero)) : ?>
          <?php echo get_the_post_thumbnail($promo_hero, 'thumbnail', ['class' => 'promo-thumb', 'loading' => 'lazy']); ?>
        <?php else : ?>
          <span class="emoji"><?php echo esc_html($pe); ?></span>
        <?php endif; ?>
        <div class="p-body">
          <h3><?php echo esc_html(get_the_title($promo_hero)); ?></h3>
          <p><?php echo esc_html(get_the_excerpt($promo_hero)); ?></p>
        </div>
      </a>
    <?php endif; ?>
    <div class="promo-small-grid">
      <?php foreach ($promo_rest as $p) :
        $pa = srm_accent($p->ID);
        $pe = srm_meta('_srm_emoji', $p->ID, '📣');
      ?>
        <a class="promo-small <?php echo esc_attr($color_map[$pa] ?? 'y'); ?>" href="<?php echo esc_url(get_permalink($p)); ?>">
          <span class="promo-tag">Реклама</span>
          <?php if (has_post_thumbnail($p)) : ?>
            <?php echo get_the_post_thumbnail($p, 'thumbnail', ['class' => 'promo-small-thumb', 'loading' => 'lazy']); ?>
          <?php else : ?>
            <span class="ps-emoji"><?php echo esc_html($pe); ?></span>
          <?php endif; ?>
          <div class="ps-body"><h4><?php echo esc_html(get_the_title($p)); ?></h4></div>
        </a>
      <?php endforeach; ?>
    </div>
  </section>

  <section>
    <div class="big-cta">
      <h2>Есть инсайд или хочешь рекламу?</h2>
      <p style="max-width:52ch;margin:0 auto 20px;font-size:16px">Мы читаем всё. Пиши — оформим дерзко, разгоним по рынку.</p>
      <a class="btn" href="https://t.me/+KXGg4OHsar0xYWRi" target="_blank" rel="noopener">Написать в Telegram ↗</a>
    </div>
  </section>
</main>

<?php get_footer(); ?>
