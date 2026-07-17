<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action('init', function () {
    $post_metas = [
        '_srm_format'    => 'string',
        '_srm_accent'    => 'string',
        '_srm_emoji'     => 'string',
        '_srm_read_time' => 'integer',
        '_srm_partner_link' => 'string',
        '_srm_featured'  => 'boolean',
    ];
    foreach ($post_metas as $key => $type) {
        register_post_meta('post', $key, [
            'show_in_rest' => true,
            'single'       => true,
            'type'         => $type,
            'auth_callback'=> fn () => current_user_can('edit_posts'),
        ]);
    }

    $service_metas = [
        '_srm_benefit'     => 'string',
        '_srm_promo_code'  => 'string',
        '_srm_promo_note'  => 'string',
        '_srm_link_url'    => 'string',
        '_srm_link_label'  => 'string',
        '_srm_company_url' => 'string',
        '_srm_featured'    => 'boolean',
    ];
    foreach ($service_metas as $key => $type) {
        register_post_meta('srm_service', $key, [
            'show_in_rest' => true,
            'single'       => true,
            'type'         => $type,
            'auth_callback'=> fn () => current_user_can('edit_posts'),
        ]);
    }

    register_post_meta('srm_job', '_srm_tags', [
        'show_in_rest' => true,
        'single'       => true,
        'type'         => 'string',
        'auth_callback'=> fn () => current_user_can('edit_posts'),
    ]);
    register_post_meta('srm_job', '_srm_apply_url', [
        'show_in_rest' => true,
        'single'       => true,
        'type'         => 'string',
        'auth_callback'=> fn () => current_user_can('edit_posts'),
    ]);
});

add_action('add_meta_boxes', function () {
    add_meta_box('srm_post_meta', 'Secret Room — оформление', 'srm_render_post_metabox', 'post', 'side', 'high');
    add_meta_box('srm_service_meta', 'Условия партнёра', 'srm_render_service_metabox', 'srm_service', 'normal', 'high');
    add_meta_box('srm_job_meta', 'Отклик и теги', 'srm_render_job_metabox', 'srm_job', 'normal', 'high');
});

function srm_render_post_metabox($post) {
    wp_nonce_field('srm_save_post_meta', 'srm_post_nonce');
    $format = get_post_meta($post->ID, '_srm_format', true) ?: 'main';
    $accent = get_post_meta($post->ID, '_srm_accent', true) ?: 'yellow';
    $emoji  = get_post_meta($post->ID, '_srm_emoji', true) ?: '📰';
    $read   = get_post_meta($post->ID, '_srm_read_time', true);
    $link   = get_post_meta($post->ID, '_srm_partner_link', true);
    $feat   = get_post_meta($post->ID, '_srm_featured', true);
    ?>
    <p><label>Формат<br>
      <select name="srm_format" style="width:100%">
        <option value="main" <?php selected($format, 'main'); ?>>Основная статья</option>
        <option value="tg" <?php selected($format, 'tg'); ?>>Из Telegram (сайдбар)</option>
        <option value="promo" <?php selected($format, 'promo'); ?>>Реклама / посев</option>
      </select>
    </label></p>
    <p><label>Акцент<br>
      <select name="srm_accent" style="width:100%">
        <?php foreach (['yellow'=>'Жёлтый','lime'=>'Лайм','pink'=>'Розовый','blue'=>'Синий'] as $k=>$l): ?>
          <option value="<?php echo esc_attr($k); ?>" <?php selected($accent, $k); ?>><?php echo esc_html($l); ?></option>
        <?php endforeach; ?>
      </select>
    </label></p>
    <p><label>Эмодзи (если нет обложки)<br>
      <input type="text" name="srm_emoji" value="<?php echo esc_attr($emoji); ?>" style="width:100%">
    </label></p>
    <p><label>Время чтения (мин)<br>
      <input type="number" name="srm_read_time" value="<?php echo esc_attr($read); ?>" style="width:100%" min="0">
    </label></p>
    <p><label>Ссылка партнёра / ТГ<br>
      <input type="url" name="srm_partner_link" value="<?php echo esc_attr($link); ?>" style="width:100%">
    </label></p>
    <p><label><input type="checkbox" name="srm_featured" value="1" <?php checked($feat, '1'); ?>> В герое на главной</label></p>
    <?php
}

function srm_render_service_metabox($post) {
    wp_nonce_field('srm_save_service_meta', 'srm_service_nonce');
    $f = [
        'benefit'     => get_post_meta($post->ID, '_srm_benefit', true),
        'promo_code'  => get_post_meta($post->ID, '_srm_promo_code', true),
        'promo_note'  => get_post_meta($post->ID, '_srm_promo_note', true),
        'link_url'    => get_post_meta($post->ID, '_srm_link_url', true),
        'link_label'  => get_post_meta($post->ID, '_srm_link_label', true) ?: 'Перейти',
        'company_url' => get_post_meta($post->ID, '_srm_company_url', true),
        'featured'    => get_post_meta($post->ID, '_srm_featured', true),
    ];
    ?>
    <p><label>Условия / выгода<br><input type="text" name="srm_benefit" value="<?php echo esc_attr($f['benefit']); ?>" class="widefat"></label></p>
    <p><label>Промокод<br><input type="text" name="srm_promo_code" value="<?php echo esc_attr($f['promo_code']); ?>" class="widefat"></label></p>
    <p><label>Заметка к промо<br><textarea name="srm_promo_note" class="widefat" rows="3"><?php echo esc_textarea($f['promo_note']); ?></textarea></label></p>
    <p><label>Ссылка регистрации / реф<br><input type="url" name="srm_link_url" value="<?php echo esc_attr($f['link_url']); ?>" class="widefat"></label></p>
    <p><label>Текст кнопки<br><input type="text" name="srm_link_label" value="<?php echo esc_attr($f['link_label']); ?>" class="widefat"></label></p>
    <p><label>Сайт компании<br><input type="url" name="srm_company_url" value="<?php echo esc_attr($f['company_url']); ?>" class="widefat"></label></p>
    <p><label><input type="checkbox" name="srm_featured" value="1" <?php checked($f['featured'], '1'); ?>> Отличное предложение</label></p>
    <p class="description">Категорию выберите в блоке справа «Категории сервисов». Порядок — поле «Порядок».</p>
    <?php
}

function srm_render_job_metabox($post) {
    wp_nonce_field('srm_save_job_meta', 'srm_job_nonce');
    $tags  = get_post_meta($post->ID, '_srm_tags', true);
    $apply = get_post_meta($post->ID, '_srm_apply_url', true) ?: 'https://t.me/+KXGg4OHsar0xYWRi';
    ?>
    <p><label>Теги (через запятую)<br>
      <input type="text" name="srm_tags" value="<?php echo esc_attr($tags); ?>" class="widefat" placeholder="Удалёнка, iGaming, Full-time">
    </label></p>
    <p><label>Ссылка отклика<br>
      <input type="url" name="srm_apply_url" value="<?php echo esc_attr($apply); ?>" class="widefat">
    </label></p>
    <?php
}

add_action('save_post_post', function ($post_id) {
    if (!isset($_POST['srm_post_nonce']) || !wp_verify_nonce($_POST['srm_post_nonce'], 'srm_save_post_meta')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    update_post_meta($post_id, '_srm_format', sanitize_text_field($_POST['srm_format'] ?? 'main'));
    update_post_meta($post_id, '_srm_accent', sanitize_text_field($_POST['srm_accent'] ?? 'yellow'));
    update_post_meta($post_id, '_srm_emoji', sanitize_text_field($_POST['srm_emoji'] ?? '📰'));
    update_post_meta($post_id, '_srm_read_time', (int) ($_POST['srm_read_time'] ?? 0));
    update_post_meta($post_id, '_srm_partner_link', esc_url_raw($_POST['srm_partner_link'] ?? ''));
    update_post_meta($post_id, '_srm_featured', isset($_POST['srm_featured']) ? '1' : '');
});

add_action('save_post_srm_service', function ($post_id) {
    if (!isset($_POST['srm_service_nonce']) || !wp_verify_nonce($_POST['srm_service_nonce'], 'srm_save_service_meta')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    update_post_meta($post_id, '_srm_benefit', sanitize_text_field($_POST['srm_benefit'] ?? ''));
    update_post_meta($post_id, '_srm_promo_code', sanitize_text_field($_POST['srm_promo_code'] ?? ''));
    update_post_meta($post_id, '_srm_promo_note', sanitize_textarea_field($_POST['srm_promo_note'] ?? ''));
    update_post_meta($post_id, '_srm_link_url', esc_url_raw($_POST['srm_link_url'] ?? ''));
    update_post_meta($post_id, '_srm_link_label', sanitize_text_field($_POST['srm_link_label'] ?? 'Перейти'));
    update_post_meta($post_id, '_srm_company_url', esc_url_raw($_POST['srm_company_url'] ?? ''));
    update_post_meta($post_id, '_srm_featured', isset($_POST['srm_featured']) ? '1' : '');
});

add_action('save_post_srm_job', function ($post_id) {
    if (!isset($_POST['srm_job_nonce']) || !wp_verify_nonce($_POST['srm_job_nonce'], 'srm_save_job_meta')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    update_post_meta($post_id, '_srm_tags', sanitize_text_field($_POST['srm_tags'] ?? ''));
    update_post_meta($post_id, '_srm_apply_url', esc_url_raw($_POST['srm_apply_url'] ?? ''));
});
