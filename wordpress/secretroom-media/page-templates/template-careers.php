<?php
/**
 * Template Name: Вакансии
 */
get_header();

$q = new WP_Query([
    'post_type'      => 'srm_job',
    'posts_per_page' => -1,
    'post_status'    => 'publish',
    'orderby'        => ['menu_order' => 'ASC', 'title' => 'ASC'],
]);
?>
<main class="wrap">
  <section class="section">
    <div class="section-head"><h2>Вакансии <span class="dot">/</span> к нам в команду</h2></div>
    <p style="max-width:640px;font-size:18px;margin-bottom:26px">Работаем удалённо, платим вовремя, не душним. Главное — уметь писать живо и не бояться острых тем.</p>
    <div class="jobs">
      <?php if ($q->have_posts()) : while ($q->have_posts()) : $q->the_post();
        $tags = array_filter(array_map('trim', explode(',', (string) get_post_meta(get_the_ID(), '_srm_tags', true))));
        $apply = get_post_meta(get_the_ID(), '_srm_apply_url', true) ?: 'https://t.me/+KXGg4OHsar0xYWRi';
      ?>
        <div class="job">
          <div>
            <h3><?php the_title(); ?></h3>
            <div class="j-meta">
              <?php foreach ($tags as $t) : ?>
                <span class="badge ghost"><?php echo esc_html($t); ?></span>
              <?php endforeach; ?>
            </div>
            <p style="margin-top:10px;max-width:60ch;color:#33332f"><?php echo esc_html(wp_strip_all_tags(get_the_content())); ?></p>
          </div>
          <a class="btn yellow" href="<?php echo esc_url($apply); ?>" target="_blank" rel="noopener">Откликнуться →</a>
        </div>
      <?php endwhile; wp_reset_postdata(); else : ?>
        <p style="font-weight:700;color:var(--gray)">Сейчас открытых вакансий нет — пиши в Telegram всё равно.</p>
      <?php endif; ?>
    </div>
  </section>

  <section>
    <div class="big-cta" style="background:var(--lime)">
      <h2>Не нашёл свою вакансию?</h2>
      <p style="max-width:52ch;margin:0 auto 20px;font-size:16px">Пиши всё равно — если ты крутой, мы придумаем, чем тебя занять.</p>
      <a class="btn" href="https://t.me/+KXGg4OHsar0xYWRi" target="_blank" rel="noopener">Откликнуться в Telegram ↗</a>
    </div>
  </section>
</main>
<?php get_footer(); ?>
