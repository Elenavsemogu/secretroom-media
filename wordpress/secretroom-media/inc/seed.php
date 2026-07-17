<?php
/**
 * Демо-контент: Инструменты → Secret Room: демо
 */
if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_menu', function () {
    add_management_page(
        'Secret Room: демо',
        'Secret Room: демо',
        'manage_options',
        'srm-seed',
        'srm_seed_page'
    );
});

function srm_seed_page() {
    if (!current_user_can('manage_options')) {
        return;
    }

    $msg = '';
    if (isset($_POST['srm_seed_run']) && check_admin_referer('srm_seed_action')) {
        $result = srm_run_seed();
        $msg = sprintf(
            'Готово: статей %d, сервисов %d, вакансий %d.',
            $result['posts'],
            $result['services'],
            $result['jobs']
        );
        srm_ensure_pages();
        flush_rewrite_rules();
    }
    ?>
    <div class="wrap">
      <h1>Secret Room — демо-контент</h1>
      <p>Заполнит сайт статьями, сервисами и вакансиями из текущего статического портала.</p>
      <p><strong>Безопасно запускать один раз.</strong> Повторный запуск не дублирует записи с тем же ярлыком (slug).</p>
      <?php if ($msg) : ?>
        <div class="notice notice-success"><p><?php echo esc_html($msg); ?></p></div>
      <?php endif; ?>
      <form method="post">
        <?php wp_nonce_field('srm_seed_action'); ?>
        <p>
          <button type="submit" name="srm_seed_run" class="button button-primary" value="1">
            Загрузить демо-контент
          </button>
        </p>
      </form>
    </div>
    <?php
}

function srm_run_seed() {
    $counts = ['posts' => 0, 'services' => 0, 'jobs' => 0];

    $articles = include SRM_THEME_DIR . '/inc/demo-articles.php';
    if (is_array($articles)) {
        foreach ($articles as $a) {
            if (srm_seed_post($a)) {
                $counts['posts']++;
            }
        }
    }

    $partners = include SRM_THEME_DIR . '/inc/demo-partners.php';
    $links = srm_default_partner_links();
    if (is_array($partners)) {
        foreach ($partners as $p) {
            if (empty($p['link_url']) && !empty($links[$p['title']])) {
                $p['link_url'] = $links[$p['title']];
            }
            if (empty($p['company_url']) && !empty($links[$p['title']])) {
                $p['company_url'] = preg_replace('/\?.*$/', '', $links[$p['title']]);
            }
            if (srm_seed_service($p)) {
                $counts['services']++;
            }
        }
    }

    foreach (srm_default_jobs() as $j) {
        if (srm_seed_job($j)) {
            $counts['jobs']++;
        }
    }

    update_option('srm_seeded', '1');
    return $counts;
}

function srm_default_partner_links() {
    return [
        'Vision' => 'https://browser.vision/',
        'Dolphin' => 'https://dolphin-anty.com/',
        'Binom' => 'https://binom.org/',
        'Octo Browser' => 'https://octobrowser.net/',
        'Cloaking House' => 'https://cloaking.house/',
        'Combo Cards' => 'https://combocards.com/',
        'TSL Apps' => 'https://tslapps.com/',
        'Apps4You' => 'https://apps4you.com/',
        'Spy House' => 'https://spy.house/',
        'AIO (Tracker)' => 'https://aio.partners/',
        'AIO (ERP)' => 'https://aio.partners/',
        'CostView' => 'https://costview.io/',
        'Affilka' => 'https://affilka.com/',
        'iGamingTextLab' => 'https://igamingtextlab.com/',
        'MangoProxy' => 'https://mangoproxy.com/',
        'ProxyShard' => 'https://proxyshard.com/?ref=12749',
    ];
}

function srm_default_jobs() {
    return [
        [
            'title' => 'Редактор / автор',
            'content' => 'Писать новости и разборы про рынок. Нужен острый язык и насмотренность.',
            'tags' => 'Удалёнка, iGaming, Full-time',
            'apply_url' => 'https://t.me/+KXGg4OHsar0xYWRi',
            'menu_order' => 10,
        ],
        [
            'title' => 'SMM-менеджер',
            'content' => 'Вести канал, придумывать мемы, разгонять посевы.',
            'tags' => 'Удалёнка, Telegram, Part-time',
            'apply_url' => 'https://t.me/+KXGg4OHsar0xYWRi',
            'menu_order' => 20,
        ],
        [
            'title' => 'Дизайнер обложек',
            'content' => 'Делать те самые дерзкие обложки постов в фирменном стиле.',
            'tags' => 'Проектно, Figma, Мемы',
            'apply_url' => 'https://t.me/+KXGg4OHsar0xYWRi',
            'menu_order' => 30,
        ],
        [
            'title' => 'Sales / реклама',
            'content' => 'Продавать рекламу партнёрам рынка и вести их до результата.',
            'tags' => 'Удалёнка, %, B2B',
            'apply_url' => 'https://t.me/+KXGg4OHsar0xYWRi',
            'menu_order' => 40,
        ],
    ];
}

function srm_seed_post($a) {
    $slug = sanitize_title($a['slug'] ?? $a['title']);
    $existing = get_page_by_path($slug, OBJECT, 'post');
    if ($existing) {
        return false;
    }

    $cat_id = 0;
    if (!empty($a['category'])) {
        $term = term_exists($a['category'], 'category');
        if (!$term) {
            $term = wp_insert_term($a['category'], 'category');
        }
        if (!is_wp_error($term)) {
            $cat_id = (int) (is_array($term) ? $term['term_id'] : $term);
        }
    }

    $post_id = wp_insert_post([
        'post_title'   => $a['title'],
        'post_name'    => $slug,
        'post_content' => $a['content'] ?? '',
        'post_excerpt' => $a['excerpt'] ?? '',
        'post_status'  => 'publish',
        'post_type'    => 'post',
        'post_date'    => !empty($a['date']) ? $a['date'] . ' 12:00:00' : current_time('mysql'),
        'post_category'=> $cat_id ? [$cat_id] : [],
    ], true);

    if (is_wp_error($post_id)) {
        return false;
    }

    update_post_meta($post_id, '_srm_format', $a['format'] ?? 'main');
    update_post_meta($post_id, '_srm_accent', $a['accent'] ?? 'yellow');
    update_post_meta($post_id, '_srm_emoji', $a['emoji'] ?? '📰');
    update_post_meta($post_id, '_srm_read_time', (int) ($a['read_time'] ?? 2));
    update_post_meta($post_id, '_srm_partner_link', $a['partner_link'] ?? '');
    update_post_meta($post_id, '_srm_featured', !empty($a['featured']) ? '1' : '');

    if (!empty($a['cover'])) {
        srm_sideload_theme_cover($post_id, $a['cover']);
    }

    return true;
}

function srm_seed_service($p) {
    $slug = sanitize_title($p['title']);
    $existing = get_page_by_path($slug, OBJECT, 'srm_service');
    if ($existing) {
        return false;
    }

    $post_id = wp_insert_post([
        'post_title'   => $p['title'],
        'post_name'    => $slug,
        'post_content' => $p['content'] ?? '',
        'post_status'  => 'publish',
        'post_type'    => 'srm_service',
        'menu_order'   => (int) ($p['menu_order'] ?? 0),
    ], true);

    if (is_wp_error($post_id)) {
        return false;
    }

    if (!empty($p['category'])) {
        $term = term_exists($p['category'], 'srm_service_cat');
        if (!$term) {
            $term = wp_insert_term($p['category'], 'srm_service_cat');
        }
        if (!is_wp_error($term)) {
            $tid = (int) (is_array($term) ? $term['term_id'] : $term);
            wp_set_object_terms($post_id, [$tid], 'srm_service_cat');
        }
    }

    update_post_meta($post_id, '_srm_benefit', $p['benefit'] ?? '');
    update_post_meta($post_id, '_srm_promo_code', $p['promo_code'] ?? '');
    update_post_meta($post_id, '_srm_promo_note', $p['promo_note'] ?? '');
    update_post_meta($post_id, '_srm_link_url', $p['link_url'] ?? '');
    update_post_meta($post_id, '_srm_link_label', $p['link_label'] ?? 'Перейти');
    update_post_meta($post_id, '_srm_company_url', $p['company_url'] ?? '');
    update_post_meta($post_id, '_srm_featured', !empty($p['featured']) ? '1' : '');

    return true;
}

function srm_seed_job($j) {
    $slug = sanitize_title($j['title']);
    $existing = get_page_by_path($slug, OBJECT, 'srm_job');
    if ($existing) {
        return false;
    }

    $post_id = wp_insert_post([
        'post_title'   => $j['title'],
        'post_name'    => $slug,
        'post_content' => $j['content'] ?? '',
        'post_status'  => 'publish',
        'post_type'    => 'srm_job',
        'menu_order'   => (int) ($j['menu_order'] ?? 0),
    ], true);

    if (is_wp_error($post_id)) {
        return false;
    }

    update_post_meta($post_id, '_srm_tags', $j['tags'] ?? '');
    update_post_meta($post_id, '_srm_apply_url', $j['apply_url'] ?? '');
    return true;
}

function srm_sideload_theme_cover($post_id, $filename) {
    $path = SRM_THEME_DIR . '/assets/covers/' . basename($filename);
    if (!file_exists($path)) {
        return;
    }

    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $upload = wp_upload_bits(basename($path), null, file_get_contents($path));
    if (!empty($upload['error'])) {
        return;
    }

    $filetype = wp_check_filetype($upload['file'], null);
    $attachment = [
        'post_mime_type' => $filetype['type'],
        'post_title'     => sanitize_file_name(basename($upload['file'])),
        'post_content'   => '',
        'post_status'    => 'inherit',
    ];
    $attach_id = wp_insert_attachment($attachment, $upload['file'], $post_id);
    if (is_wp_error($attach_id)) {
        return;
    }
    $meta = wp_generate_attachment_metadata($attach_id, $upload['file']);
    wp_update_attachment_metadata($attach_id, $meta);
    set_post_thumbnail($post_id, $attach_id);
}
