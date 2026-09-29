<?php
/**
 * Hidden SEO articles: indexed, not shown on homepage / articles feed.
 */
if (!defined('ABSPATH')) {
    exit;
}

/**
 * IDs of published posts with format=seo.
 */
function srm_seo_post_ids() {
    static $ids = null;
    if ($ids !== null) {
        return $ids;
    }
    $q = new WP_Query([
        'post_type'              => 'post',
        'post_status'            => 'publish',
        'posts_per_page'         => -1,
        'fields'                 => 'ids',
        'no_found_rows'          => true,
        'update_post_meta_cache' => false,
        'update_post_term_cache' => false,
        'meta_key'               => '_srm_format',
        'meta_value'             => 'seo',
    ]);
    $ids = array_map('intval', $q->posts);
    return $ids;
}

/**
 * Exclude SEO posts from public listings (home blog index, main query archives).
 * Keep them visible on singular, search (optional), and admin.
 */
add_action('pre_get_posts', function ($query) {
    if (is_admin() || !$query->is_main_query()) {
        return;
    }
    // Allow singular SEO posts.
    if ($query->is_singular()) {
        return;
    }
    // Keep SEO posts findable via site search / feeds would dilute UX — exclude from feed & blog.
    if ($query->is_home() || $query->is_category() || $query->is_tag() || $query->is_date() || $query->is_author() || $query->is_feed()) {
        $ids = srm_seo_post_ids();
        if ($ids) {
            $not_in = $query->get('post__not_in');
            $not_in = is_array($not_in) ? $not_in : [];
            $query->set('post__not_in', array_values(array_unique(array_merge($not_in, $ids))));
        }
    }
});

/** Pretty URLs: /seo/{slug}/ for format=seo posts. */
add_action('init', function () {
    add_rewrite_rule('^seo/([^/]+)/?$', 'index.php?name=$matches[1]', 'top');
}, 11);

add_filter('post_link', function ($permalink, $post) {
    if (!is_object($post) || $post->post_type !== 'post') {
        return $permalink;
    }
    if (get_post_meta($post->ID, '_srm_format', true) === 'seo') {
        return home_url('/seo/' . $post->post_name . '/');
    }
    return $permalink;
}, 10, 2);

add_filter('post_type_link', function ($permalink, $post) {
    if ($post->post_type === 'post' && get_post_meta($post->ID, '_srm_format', true) === 'seo') {
        return home_url('/seo/' . $post->post_name . '/');
    }
    return $permalink;
}, 10, 2);

/** Meta description + robots for SEO posts. */
add_action('wp_head', function () {
    if (!is_singular('post')) {
        return;
    }
    $id = get_the_ID();
    if (srm_format($id) !== 'seo') {
        // Still output description if set on any post.
    }
    $desc = get_post_meta($id, '_srm_seo_description', true);
    if (!$desc) {
        $desc = get_the_excerpt($id);
    }
    if ($desc) {
        echo '<meta name="description" content="' . esc_attr(wp_strip_all_tags($desc)) . '">' . "\n";
    }
    $keys = get_post_meta($id, '_srm_seo_keywords', true);
    if ($keys) {
        echo '<meta name="keywords" content="' . esc_attr($keys) . '">' . "\n";
    }
    if (srm_format($id) === 'seo') {
        echo '<meta name="robots" content="index,follow">' . "\n";
        echo '<link rel="canonical" href="' . esc_url(get_permalink($id)) . '">' . "\n";
    }
}, 1);

add_filter('document_title_parts', function ($parts) {
    if (!is_singular('post')) {
        return $parts;
    }
    $custom = get_post_meta(get_the_ID(), '_srm_seo_title', true);
    if ($custom) {
        $parts['title'] = $custom;
    }
    return $parts;
});

/** Admin: import SEO articles tool. */
add_action('admin_menu', function () {
    add_management_page(
        'Secret Room: SEO',
        'Secret Room: SEO',
        'edit_posts',
        'srm-seo-import',
        'srm_seo_import_page'
    );
});

function srm_seo_import_page() {
    if (!current_user_can('edit_posts')) {
        return;
    }
    $msg = '';
    if (isset($_POST['srm_seo_import']) && check_admin_referer('srm_seo_import_action')) {
        $n = srm_import_seo_articles();
        $msg = sprintf('Импортировано SEO-статей: %d. На главной и в разделе «Статьи» они не появятся, но будут в sitemap и доступны по прямым ссылкам /seo/…', $n);
        flush_rewrite_rules(false);
    }
    ?>
    <div class="wrap">
      <h1>Secret Room — скрытые SEO-статьи</h1>
      <p>Эти материалы <strong>не показываются на главной и в ленте статей</strong>, но открыты для индексации поисковиками.</p>
      <h2>Как добавить новую SEO-статью вручную</h2>
      <ol>
        <li>Записи → Добавить</li>
        <li>Напишите текст как обычно (можно вставить HTML-таблицы)</li>
        <li>Справа в блоке «Secret Room — оформление» выберите формат <strong>SEO (скрытая, только поиск)</strong></li>
        <li>Заполните SEO-заголовок и описание</li>
        <li>Опубликуйте — статья получит адрес вида <code>/seo/ваш-ярлык/</code></li>
      </ol>
      <h2>Импорт трёх готовых гайдов</h2>
      <p>Загрузит статьи про провайдеров, партнёрки и ТОП-20 слотов (без дублей по slug).</p>
      <?php if ($msg) : ?>
        <div class="notice notice-success"><p><?php echo esc_html($msg); ?></p></div>
      <?php endif; ?>
      <form method="post">
        <?php wp_nonce_field('srm_seo_import_action'); ?>
        <p><button type="submit" name="srm_seo_import" class="button button-primary" value="1">Импортировать SEO-статьи</button></p>
      </form>
      <?php
      $ids = srm_seo_post_ids();
      if ($ids) :
      ?>
        <h2>Уже на сайте (<?php echo count($ids); ?>)</h2>
        <ul>
          <?php foreach ($ids as $id) : ?>
            <li>
              <a href="<?php echo esc_url(get_permalink($id)); ?>" target="_blank" rel="noopener"><?php echo esc_html(get_the_title($id)); ?></a>
              — <a href="<?php echo esc_url(get_edit_post_link($id)); ?>">править</a>
            </li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>
    </div>
    <?php
}

function srm_import_seo_articles() {
    $file = SRM_THEME_DIR . '/inc/seo-articles-data.json';
    if (!file_exists($file)) {
        return 0;
    }
    $raw = file_get_contents($file);
    $items = json_decode($raw, true);
    if (!is_array($items)) {
        return 0;
    }
    $n = 0;
    foreach ($items as $a) {
        if (srm_seed_seo_article($a)) {
            $n++;
        }
    }
    return $n;
}

function srm_seed_seo_article($a) {
    $slug = sanitize_title($a['slug'] ?? $a['title'] ?? '');
    if (!$slug) {
        return false;
    }
    $existing = get_page_by_path($slug, OBJECT, 'post');
    if ($existing) {
        // Update format/meta if already exists as plain post.
        update_post_meta($existing->ID, '_srm_format', 'seo');
        if (!empty($a['seo_title'])) {
            update_post_meta($existing->ID, '_srm_seo_title', sanitize_text_field($a['seo_title']));
        }
        if (!empty($a['description'])) {
            update_post_meta($existing->ID, '_srm_seo_description', sanitize_text_field($a['description']));
        }
        if (!empty($a['keywords'])) {
            update_post_meta($existing->ID, '_srm_seo_keywords', sanitize_text_field($a['keywords']));
        }
        return false;
    }

    $post_id = wp_insert_post([
        'post_title'   => $a['title'],
        'post_name'    => $slug,
        'post_content' => $a['content'] ?? '',
        'post_excerpt' => $a['excerpt'] ?? ($a['description'] ?? ''),
        'post_status'  => 'publish',
        'post_type'    => 'post',
    ], true);

    if (is_wp_error($post_id)) {
        return false;
    }

    update_post_meta($post_id, '_srm_format', 'seo');
    update_post_meta($post_id, '_srm_accent', 'blue');
    update_post_meta($post_id, '_srm_emoji', '🔎');
    update_post_meta($post_id, '_srm_seo_title', sanitize_text_field($a['seo_title'] ?? $a['title']));
    update_post_meta($post_id, '_srm_seo_description', sanitize_text_field($a['description'] ?? ''));
    update_post_meta($post_id, '_srm_seo_keywords', sanitize_text_field($a['keywords'] ?? ''));

    return true;
}
