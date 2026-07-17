<?php
/**
 * Template Name: Календарь
 */
get_header();
?>
<main class="wrap">
  <nav class="breadcrumbs" aria-label="Хлебные крошки">
    <a href="<?php echo esc_url(home_url('/')); ?>">Главная</a>
    <span>/</span>
    <span>Календарь</span>
  </nav>

  <section class="section">
    <div class="section-head">
      <h2>Календарь <span class="dot">/</span> iGaming 2026</h2>
      <a href="https://igaming-calendar.com/" target="_blank" rel="noopener">Открыть отдельно ↗</a>
    </div>
    <div style="border:3px solid var(--ink);border-radius:var(--radius);overflow:hidden;background:#111;min-height:70vh">
      <iframe
        src="https://igaming-calendar.com/"
        title="Календарь iGaming конференций"
        style="width:100%;height:78vh;border:0;display:block"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  </section>
</main>
<?php get_footer(); ?>
