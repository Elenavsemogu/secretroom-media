<?php
/**
 * Secret Room Media — theme bootstrap
 */
if (!defined('ABSPATH')) {
    exit;
}

define('SRM_THEME_VERSION', '1.0.0');
define('SRM_THEME_DIR', get_template_directory());
define('SRM_THEME_URI', get_template_directory_uri());

require_once SRM_THEME_DIR . '/inc/helpers.php';
require_once SRM_THEME_DIR . '/inc/cpt.php';
require_once SRM_THEME_DIR . '/inc/meta.php';
require_once SRM_THEME_DIR . '/inc/seed.php';

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);
    add_theme_support('custom-logo', [
        'height'      => 80,
        'width'       => 240,
        'flex-height' => true,
        'flex-width'  => true,
    ]);

    register_nav_menus([
        'primary' => __('Главное меню', 'secretroom-media'),
        'footer'  => __('Меню в подвале', 'secretroom-media'),
    ]);
});

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'srm-fonts',
        'https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=Inter:wght@400;500;700;800&display=swap',
        [],
        null
    );
    wp_enqueue_style(
        'srm-styles',
        SRM_THEME_URI . '/assets/css/styles.css',
        ['srm-fonts'],
        SRM_THEME_VERSION
    );
    wp_enqueue_script(
        'srm-theme',
        SRM_THEME_URI . '/assets/js/theme.js',
        [],
        SRM_THEME_VERSION,
        true
    );
});

add_filter('excerpt_length', fn () => 28);
add_filter('excerpt_more', fn () => '…');

/**
 * On theme activation: create pages + assign templates + set front page.
 */
add_action('after_switch_theme', function () {
    srm_ensure_pages();
    if (function_exists('flush_rewrite_rules')) {
        flush_rewrite_rules();
    }
});

add_action('init', function () {
    // Soft ensure pages exist without forcing every request rewrite flush.
    if (get_option('srm_pages_ready') !== '1') {
        srm_ensure_pages();
        update_option('srm_pages_ready', '1');
    }
}, 20);

function srm_ensure_pages() {
    $pages = [
        'services' => [
            'title'    => 'Сервисы',
            'slug'     => 'services',
            'template' => 'page-templates/template-services.php',
        ],
        'careers' => [
            'title'    => 'Вакансии',
            'slug'     => 'careers',
            'template' => 'page-templates/template-careers.php',
        ],
        'calendar' => [
            'title'    => 'Календарь',
            'slug'     => 'calendar',
            'template' => 'page-templates/template-calendar.php',
        ],
        'articles' => [
            'title'    => 'Статьи',
            'slug'     => 'articles',
            'template' => '',
        ],
    ];

    $ids = [];
    foreach ($pages as $key => $cfg) {
        $existing = get_page_by_path($cfg['slug']);
        if ($existing) {
            $ids[$key] = $existing->ID;
        } else {
            $ids[$key] = wp_insert_post([
                'post_title'   => $cfg['title'],
                'post_name'    => $cfg['slug'],
                'post_status'  => 'publish',
                'post_type'    => 'page',
                'post_content' => '',
            ]);
        }
        if (!empty($cfg['template']) && $ids[$key] && !is_wp_error($ids[$key])) {
            update_post_meta($ids[$key], '_wp_page_template', $cfg['template']);
        }
    }

    if (!empty($ids['articles'])) {
        update_option('show_on_front', 'page');
        // Front page = a blank "home" page content via front-page.php; posts page = articles.
        $home = get_page_by_path('home');
        if (!$home) {
            $home_id = wp_insert_post([
                'post_title'  => 'Главная',
                'post_name'   => 'home',
                'post_status' => 'publish',
                'post_type'   => 'page',
            ]);
        } else {
            $home_id = $home->ID;
        }
        update_option('page_on_front', $home_id);
        update_option('page_for_posts', $ids['articles']);
    }

    // Default category terms for services.
    $cats = [
        'Антидетект-браузеры',
        'Клоакинг',
        'Карты',
        'Приложения и PWA',
        'Дизайнеры креативов',
        'Spy-сервисы',
        'Трекеры',
        'Софт для команд',
        'Контент для сайтов (SEO)',
        'Прокси',
    ];
    foreach ($cats as $name) {
        if (!term_exists($name, 'srm_service_cat')) {
            wp_insert_term($name, 'srm_service_cat');
        }
    }

    $post_cats = ['Регуляторы', 'Скандалы', 'Казино', 'Медиабаинг', 'Конференции', 'Сервисы', 'Мемы'];
    foreach ($post_cats as $name) {
        if (!term_exists($name, 'category')) {
            wp_insert_term($name, 'category');
        }
    }
}
