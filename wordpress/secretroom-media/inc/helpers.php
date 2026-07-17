<?php
if (!defined('ABSPATH')) {
    exit;
}

function srm_fmt_date($date = null) {
    $ts = $date ? strtotime($date) : time();
    if (!$ts) {
        return '';
    }
    $months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
    return (int) date_i18n('j', $ts) . ' ' . $months[(int) date_i18n('n', $ts) - 1] . ' ' . date_i18n('Y', $ts);
}

function srm_meta($key, $post_id = null, $default = '') {
    $post_id = $post_id ?: get_the_ID();
    $v = get_post_meta($post_id, $key, true);
    return ($v === '' || $v === null) ? $default : $v;
}

function srm_accent($post_id = null) {
    $a = srm_meta('_srm_accent', $post_id, 'yellow');
    $allowed = ['yellow', 'lime', 'pink', 'blue'];
    return in_array($a, $allowed, true) ? $a : 'yellow';
}

function srm_format($post_id = null) {
    $f = srm_meta('_srm_format', $post_id, 'main');
    return in_array($f, ['main', 'tg', 'promo'], true) ? $f : 'main';
}

function srm_logo_url() {
    return SRM_THEME_URI . '/assets/logo.png';
}

function srm_nav_class($slug) {
    if ($slug === 'home' && is_front_page()) {
        return 'active';
    }
    if ($slug === 'articles' && (is_home() || is_singular('post') || is_category() || is_tag())) {
        return 'active';
    }
    if ($slug === 'services' && (is_page('services') || is_singular('srm_service') || is_post_type_archive('srm_service'))) {
        return 'active';
    }
    if ($slug === 'careers' && (is_page('careers') || is_singular('srm_job'))) {
        return 'active';
    }
    if ($slug === 'calendar' && is_page('calendar')) {
        return 'active';
    }
    return '';
}

function srm_page_url($slug) {
    $page = get_page_by_path($slug);
    return $page ? get_permalink($page) : home_url('/' . $slug . '/');
}

function srm_reading_time($post_id = null) {
    $post_id = $post_id ?: get_the_ID();
    $custom = (int) srm_meta('_srm_read_time', $post_id, 0);
    if ($custom > 0) {
        return $custom;
    }
    $words = str_word_count(wp_strip_all_tags(get_post_field('post_content', $post_id)));
    return max(1, (int) ceil($words / 180));
}

function srm_card_html($post_id, $wide = false) {
    $format = srm_format($post_id);
    $accent = srm_accent($post_id);
    $emoji  = srm_meta('_srm_emoji', $post_id, '📰');
    $cats   = get_the_category($post_id);
    $cat    = $cats ? $cats[0]->name : '';
    $badge  = $format === 'tg'
        ? '<span class="badge tg">из Telegram</span>'
        : '<span class="badge cat">' . esc_html($cat) . '</span>';
    $thumb = get_the_post_thumbnail($post_id, 'large', ['class' => 'thumb-img', 'loading' => 'lazy']);
    $wide_cls = $wide ? ' wide' : '';

    ob_start();
    ?>
    <a class="card<?php echo esc_attr($wide_cls); ?>" href="<?php echo esc_url(get_permalink($post_id)); ?>">
      <div class="thumb" style="background:var(--<?php echo esc_attr($accent); ?>)">
        <?php echo $badge; ?>
        <?php if ($thumb) : ?>
          <?php echo $thumb; ?>
        <?php else : ?>
          <span class="emoji"><?php echo esc_html($emoji); ?></span>
        <?php endif; ?>
      </div>
      <div class="card-body">
        <h3><?php echo esc_html(get_the_title($post_id)); ?></h3>
        <p class="dek"><?php echo esc_html(get_the_excerpt($post_id)); ?></p>
        <div class="meta">
          <span class="cat"><?php echo esc_html($cat); ?></span>·
          <span><?php echo esc_html(srm_fmt_date(get_the_date('c', $post_id))); ?></span>·
          <span><?php echo (int) srm_reading_time($post_id); ?> мин</span>
        </div>
      </div>
    </a>
    <?php
    return ob_get_clean();
}

function srm_query_by_format($format, $args = []) {
    $defaults = [
        'post_type'      => 'post',
        'posts_per_page' => 12,
        'post_status'    => 'publish',
        'meta_key'       => '_srm_format',
        'meta_value'     => $format,
    ];
    return new WP_Query(array_merge($defaults, $args));
}

function srm_render_service_section($cat, $items, $accent) {
    ?>
    <section class="svc-section" data-cat="<?php echo esc_attr($cat); ?>">
      <div class="svc-section-head">
        <h3 class="svc-cat-title">
          <span class="svc-cat-dot" style="background:var(--<?php echo esc_attr($accent); ?>)"></span>
          <?php echo esc_html($cat); ?>
        </h3>
        <span class="svc-section-count"><?php echo count($items); ?></span>
      </div>
      <div class="svc-grid">
        <?php foreach ($items as $p) :
          $benefit = get_post_meta($p->ID, '_srm_benefit', true);
          $promo   = get_post_meta($p->ID, '_srm_promo_code', true);
          $note    = get_post_meta($p->ID, '_srm_promo_note', true);
          $link    = get_post_meta($p->ID, '_srm_link_url', true);
          $label   = get_post_meta($p->ID, '_srm_link_label', true) ?: 'Перейти';
          $site    = get_post_meta($p->ID, '_srm_company_url', true);
          $href    = $link ?: $site;
          $feat    = get_post_meta($p->ID, '_srm_featured', true) === '1';
          $domain  = '';
          if ($href) {
              $host = wp_parse_url($href, PHP_URL_HOST);
              $domain = $host ? preg_replace('/^www\./', '', $host) : '';
          }
          $fav = $domain ? 'https://www.google.com/s2/favicons?domain=' . rawurlencode($domain) . '&sz=128' : '';
          $initials = '';
          foreach (preg_split('/\s+/', $p->post_title) as $w) {
              $initials .= mb_strtoupper(mb_substr($w, 0, 1));
              if (mb_strlen($initials) >= 2) {
                  break;
              }
          }
        ?>
          <article class="svc-card tone-<?php echo esc_attr($accent); ?><?php echo $feat ? ' featured' : ''; ?>">
            <?php if ($feat) : ?><span class="svc-badge">Отличное предложение</span><?php endif; ?>
            <div class="svc-card-top">
              <div class="svc-logo<?php echo $fav ? ' has-img' : ''; ?>" style="background:var(--<?php echo esc_attr($accent); ?>)">
                <?php if ($fav) : ?>
                  <img src="<?php echo esc_url($fav); ?>" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.remove('has-img');this.nextElementSibling.style.display='grid'">
                  <span class="svc-logo-fallback" style="display:none"><?php echo esc_html($initials); ?></span>
                <?php else : ?>
                  <span class="svc-logo-fallback"><?php echo esc_html($initials); ?></span>
                <?php endif; ?>
              </div>
              <div class="svc-card-head">
                <h3 class="svc-card-name">
                  <?php if ($site) : ?>
                    <a href="<?php echo esc_url($site); ?>" target="_blank" rel="noopener"><?php echo esc_html($p->post_title); ?></a>
                  <?php else : ?>
                    <?php echo esc_html($p->post_title); ?>
                  <?php endif; ?>
                </h3>
                <div class="svc-card-tag"><?php echo esc_html($cat); ?></div>
              </div>
            </div>
            <p class="svc-card-desc"><?php echo esc_html(wp_strip_all_tags($p->post_content)); ?></p>
            <?php if ($benefit) : ?><div class="svc-card-advantage"><?php echo esc_html($benefit); ?></div><?php endif; ?>
            <?php if ($note) : ?><div class="svc-card-note"><?php echo esc_html($note); ?></div><?php endif; ?>
            <div class="svc-card-foot">
              <?php if ($promo) : ?>
                <button type="button" class="svc-card-promo" data-code="<?php echo esc_attr($promo); ?>">
                  <span>Промокод · клик = копировать</span><strong><?php echo esc_html($promo); ?></strong>
                </button>
              <?php endif; ?>
              <?php if ($href) : ?>
                <a class="btn svc-card-cta" href="<?php echo esc_url($href); ?>" target="_blank" rel="noopener"><?php echo esc_html($label); ?> ↗</a>
              <?php elseif (!$promo) : ?>
                <span class="svc-card-miss">Условия уточняйте у партнёра</span>
              <?php endif; ?>
            </div>
          </article>
        <?php endforeach; ?>
      </div>
    </section>
    <?php
}
