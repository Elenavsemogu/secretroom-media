<?php
/**
 * Template Name: Сервисы партнёров
 */
get_header();

$q = new WP_Query([
    'post_type'      => 'srm_service',
    'posts_per_page' => -1,
    'post_status'    => 'publish',
    'orderby'        => ['menu_order' => 'ASC', 'title' => 'ASC'],
]);

$by_cat = [];
while ($q->have_posts()) {
    $q->the_post();
    $terms = get_the_terms(get_the_ID(), 'srm_service_cat');
    $cat = ($terms && !is_wp_error($terms)) ? $terms[0]->name : 'Другое';
    if (!isset($by_cat[$cat])) {
        $by_cat[$cat] = [];
    }
    $by_cat[$cat][] = get_post();
}
wp_reset_postdata();

$order = [
    'Антидетект-браузеры', 'Клоакинг', 'Карты', 'Приложения и PWA', 'Дизайнеры креативов',
    'Spy-сервисы', 'Трекеры', 'Софт для команд', 'Контент для сайтов (SEO)', 'Прокси',
];
$accents = ['yellow', 'blue', 'pink', 'lime'];
$total = array_sum(array_map('count', $by_cat));
?>
<main class="wrap">
  <nav class="breadcrumbs" aria-label="Хлебные крошки">
    <a href="<?php echo esc_url(home_url('/')); ?>">Главная</a>
    <span>/</span>
    <span>Сервисы</span>
  </nav>

  <section class="section svc-hero">
    <div class="section-head">
      <h2>Сервисы <span class="dot">/</span> партнёры</h2>
    </div>
    <p class="svc-lead">Партнёрские сервисы со скидками и промокодами для читателей Secret Room. Фильтр по категории.</p>
    <p class="svc-partner-cta">
      Стать партнёром:
      <a href="https://t.me/judasvanzandt" target="_blank" rel="noopener">@judasvanzandt ↗</a>
    </p>
  </section>

  <section class="svc-filters" aria-label="Категории">
    <div class="svc-cats">
      <button type="button" class="svc-cat-pill active" data-cat="all">Все <span class="svc-count"><?php echo (int) $total; ?></span></button>
      <?php foreach ($order as $i => $cat) :
        if (empty($by_cat[$cat])) continue;
        $short = $cat;
        if (mb_strlen($cat) > 18) {
            $map = [
                'Антидетект-браузеры' => 'Антики',
                'Приложения и PWA' => 'PWA',
                'Дизайнеры креативов' => 'Креативы',
                'Spy-сервисы' => 'Spy',
                'Софт для команд' => 'Софт',
                'Контент для сайтов (SEO)' => 'SEO',
            ];
            $short = $map[$cat] ?? $cat;
        }
      ?>
        <button type="button" class="svc-cat-pill" data-cat="<?php echo esc_attr($cat); ?>">
          <?php echo esc_html($short); ?> <span class="svc-count"><?php echo count($by_cat[$cat]); ?></span>
        </button>
      <?php endforeach; ?>
    </div>
  </section>

  <div class="svc-root">
    <?php
    $shown = [];
    foreach ($order as $i => $cat) {
        if (empty($by_cat[$cat])) continue;
        $shown[$cat] = true;
        $accent = $accents[$i % count($accents)];
        srm_render_service_section($cat, $by_cat[$cat], $accent);
    }
    foreach ($by_cat as $cat => $items) {
        if (!empty($shown[$cat])) continue;
        srm_render_service_section($cat, $items, 'yellow');
    }
    if (!$total) {
        echo '<div class="svc-empty">Сервисов пока нет. Добавьте в админке: Сервисы → Добавить.</div>';
    }
    ?>
  </div>
</main>
<?php get_footer(); ?>

