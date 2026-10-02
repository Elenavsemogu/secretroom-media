<?php
/**
 * SEO articles: not on the homepage feed, but visible at the end of «Статьи»
 * and fully indexable by search engines (/seo/{slug}/).
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
 * Homepage uses srm_query_by_format(main/tg/promo) — SEO never appears there.
 * On the blog index («Статьи») keep SEO posts and sort them to the end.
 */
add_filter('posts_clauses', function ($clauses, $query) {
    if (is_admin() || !$query->is_main_query()) {
        return $clauses;
    }
    if (!$query->is_home() && !$query->is_category() && !$query->is_tag()) {
        return $clauses;
    }
    global $wpdb;
    $clauses['join'] .= " LEFT JOIN {$wpdb->postmeta} AS srm_seo_fmt ON ({$wpdb->posts}.ID = srm_seo_fmt.post_id AND srm_seo_fmt.meta_key = '_srm_format') ";
    $clauses['orderby'] = " CASE WHEN srm_seo_fmt.meta_value = 'seo' THEN 1 ELSE 0 END ASC, " . $clauses['orderby'];
    return $clauses;
}, 20, 2);

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

/**
 * Auto-import bundled SEO guides once after theme update.
 */
add_action('init', function () {
    if (get_option('srm_seo_articles_imported') === '1.4.3') {
        return;
    }
    // Avoid running during AJAX/cron noise before DB is ready.
    if (defined('DOING_AJAX') && DOING_AJAX) {
        return;
    }
    if (!function_exists('srm_import_seo_articles')) {
        return;
    }
    srm_import_seo_articles();
    update_option('srm_seo_articles_imported', '1.4.3');
    // Clear cached ID list.
    // (srm_seo_post_ids uses a static; next request will refresh.)
}, 40);

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
        delete_option('srm_seo_articles_imported');
        $n = srm_import_seo_articles();
        update_option('srm_seo_articles_imported', '1.4.3');
        $msg = sprintf(
            'Импортировано новых SEO-статей: %d. Они не на главной, но в конце списка «Статьи» и по адресу /seo/…',
            $n
        );
        flush_rewrite_rules(false);
    }
    ?>
    <div class="wrap">
      <h1>Secret Room — SEO-статьи (не на главной)</h1>
      <p>Эти материалы <strong>не показываются на главной</strong>, но видны пользователям <strong>в конце раздела «Статьи»</strong> и индексируются поисковиками.</p>
      <h2>Как добавить новую SEO-статью</h2>
      <ol>
        <li>Записи → Добавить</li>
        <li>Напишите текст как обычно</li>
        <li>Справа в «Secret Room — оформление» выберите формат <strong>SEO (не на главной)</strong></li>
        <li>Заполните SEO-заголовок и описание</li>
        <li>Опубликуйте — адрес вида <code>/seo/ваш-ярлык/</code>, в ленте статей — в конце списка</li>
      </ol>
      <h2>Импорт готовых гайдов</h2>
      <p>Загрузит статьи про провайдеров, партнёрки и ТОП-20 слотов (без дублей по slug). При обновлении темы импорт запускается сам один раз.</p>
      <?php if ($msg) : ?>
        <div class="notice notice-success"><p><?php echo esc_html($msg); ?></p></div>
      <?php endif; ?>
      <form method="post">
        <?php wp_nonce_field('srm_seo_import_action'); ?>
        <p><button type="submit" name="srm_seo_import" class="button button-primary" value="1">Импортировать / обновить SEO-статьи</button></p>
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
        // Refresh content from bundled seed when re-importing.
        // Excerpt stays empty: Description is meta-only, not a visible dek.
        if (!empty($a['content'])) {
            wp_update_post([
                'ID'           => $existing->ID,
                'post_content' => $a['content'],
                'post_excerpt' => '',
                'post_title'   => $a['title'] ?? get_the_title($existing),
            ]);
        } else {
            wp_update_post([
                'ID'           => $existing->ID,
                'post_excerpt' => '',
            ]);
        }
        return false;
    }

    $post_id = wp_insert_post([
        'post_title'   => $a['title'],
        'post_name'    => $slug,
        'post_content' => $a['content'] ?? '',
        'post_excerpt' => '',
        'post_status'  => 'publish',
        'post_type'    => 'post',
    ], true);

    if (is_wp_error($post_id)) {
        return false;
    }

    // Category «Гайды» for the articles filter pills.
    $term = term_exists('Гайды', 'category');
    if (!$term) {
        $term = wp_insert_term('Гайды', 'category');
    }
    if (!is_wp_error($term)) {
        $tid = (int) (is_array($term) ? $term['term_id'] : $term);
        wp_set_post_categories($post_id, [$tid]);
    }

    update_post_meta($post_id, '_srm_format', 'seo');
    update_post_meta($post_id, '_srm_accent', 'blue');
    update_post_meta($post_id, '_srm_emoji', '🔎');
    update_post_meta($post_id, '_srm_seo_title', sanitize_text_field($a['seo_title'] ?? $a['title']));
    update_post_meta($post_id, '_srm_seo_description', sanitize_text_field($a['description'] ?? ''));
    update_post_meta($post_id, '_srm_seo_keywords', sanitize_text_field($a['keywords'] ?? ''));

    return true;
}
