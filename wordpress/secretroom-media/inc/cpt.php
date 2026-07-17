<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action('init', function () {
    register_post_type('srm_service', [
        'labels' => [
            'name'          => 'Сервисы',
            'singular_name' => 'Сервис',
            'add_new_item'  => 'Добавить сервис',
            'edit_item'     => 'Редактировать сервис',
            'menu_name'     => 'Сервисы',
        ],
        'public'       => true,
        'show_in_rest' => true,
        'menu_icon'    => 'dashicons-admin-tools',
        'supports'     => ['title', 'editor', 'thumbnail', 'page-attributes'],
        'has_archive'  => false,
        'rewrite'      => ['slug' => 'service'],
    ]);

    register_taxonomy('srm_service_cat', 'srm_service', [
        'labels' => [
            'name'          => 'Категории сервисов',
            'singular_name' => 'Категория сервиса',
        ],
        'public'       => true,
        'hierarchical' => true,
        'show_in_rest' => true,
        'rewrite'      => ['slug' => 'service-cat'],
    ]);

    register_post_type('srm_job', [
        'labels' => [
            'name'          => 'Вакансии',
            'singular_name' => 'Вакансия',
            'add_new_item'  => 'Добавить вакансию',
            'edit_item'     => 'Редактировать вакансию',
            'menu_name'     => 'Вакансии',
        ],
        'public'       => true,
        'show_in_rest' => true,
        'menu_icon'    => 'dashicons-businessman',
        'supports'     => ['title', 'editor', 'page-attributes'],
        'has_archive'  => false,
        'rewrite'      => ['slug' => 'job'],
    ]);
});
